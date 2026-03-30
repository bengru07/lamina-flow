use anyhow::Result;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tokio::process::Command;
use tokio::io::{AsyncWriteExt, BufReader, AsyncBufReadExt};
use dashmap::DashMap;
use lamina_core::manifest::{NodeManifest, Executor, LifecycleHook};
use tracing::{info, error};
use tokio::sync::{Mutex, oneshot};
use std::collections::HashSet;

#[derive(Debug)]
pub struct PersistentResult {
    pub port: String,
    pub data: serde_json::Value,
}

struct PendingRequest {
    tx: oneshot::Sender<serde_json::Value>,
}

struct NodeProcess {
    stdin: Arc<Mutex<tokio::process::ChildStdin>>,
    pending: Arc<DashMap<String, PendingRequest>>,
}

pub struct PersistentRuntime {
    processes: DashMap<String, NodeProcess>,
    initializing: Mutex<HashSet<String>>,
}

impl PersistentRuntime {
    pub fn new() -> Self {
        Self {
            processes: DashMap::new(),
            initializing: Mutex::new(HashSet::new()),
        }
    }

    pub async fn boot_eager_nodes(&self, manifests: &[NodeManifest]) -> Result<()> {
        for manifest in manifests {
            if manifest.eager_init {
                info!("eager init for node {}", manifest.id);
                self.init_node(manifest).await?;
            }
        }
        Ok(())
    }
    pub async fn execute(
        &self,
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: HashMap<String, serde_json::Value>,
    ) -> Result<Vec<PersistentResult>> {
        if !self.processes.contains_key(&manifest.id) {
            let mut initializing = self.initializing.lock().await;
            if !self.processes.contains_key(&manifest.id) {
                if !initializing.contains(&manifest.id) {
                    initializing.insert(manifest.id.clone());
                    drop(initializing);
                    self.init_node(manifest).await?;
                    self.initializing.lock().await.remove(&manifest.id);
                } else {
                    drop(initializing);
                    while !self.processes.contains_key(&manifest.id) {
                        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
                    }
                }
            }
        }

        tracing::debug!("sending trigger to node {}", manifest.id);
        let request_id = uuid::Uuid::new_v4().to_string();
        let (tx, rx) = oneshot::channel();

        let write_result = if let Some(process) = self.processes.get(&manifest.id) {
            tracing::debug!("got process handle for node {}", manifest.id);
            process.pending.insert(request_id.clone(), PendingRequest { tx });

            let msg = serde_json::json!({
                "jsonrpc": "2.0",
                "method": "trigger",
                "id": request_id,
                "params": {
                    "execution_id": execution_id,
                    "inputs": inputs,
                }
            });

            Self::write_line(&process.stdin, &msg).await
        } else {
            anyhow::bail!("node process not found after init: {}", manifest.id);
        };

        if let Err(e) = write_result {
            tracing::warn!("node {} pipe broken, reinitializing: {}", manifest.id, e);
            self.processes.remove(&manifest.id);
            self.init_node(manifest).await?;

            let request_id = uuid::Uuid::new_v4().to_string();
            let (tx2, rx2) = oneshot::channel();

            if let Some(process) = self.processes.get(&manifest.id) {
                process.pending.insert(request_id.clone(), PendingRequest { tx: tx2 });
                let msg = serde_json::json!({
                    "jsonrpc": "2.0",
                    "method": "trigger",
                    "id": request_id,
                    "params": {
                        "execution_id": execution_id,
                        "inputs": inputs,
                    }
                });
                Self::write_line(&process.stdin, &msg).await?;
            }

            tracing::debug!("waiting for response from node {} after reinit", manifest.id);
            let response = rx2.await
                .map_err(|_| anyhow::anyhow!("node process dropped response channel after reinit"))?;
            return Self::parse_emit_result(response);
        }

        tracing::debug!("trigger written to node {}", manifest.id);
        tracing::debug!("waiting for response from node {}", manifest.id);
        let response = rx.await
            .map_err(|_| anyhow::anyhow!("node process dropped response channel"))?;

        tracing::debug!("got response from node {}: {:?}", manifest.id, response);
        Self::parse_emit_result(response)
    }
    
    pub async fn dispose(&self, node_id: &str) -> Result<()> {
        if self.processes.contains_key(node_id) {
            self.send_lifecycle(node_id, LifecycleHook::OnDispose, None).await?;
            self.processes.remove(node_id);
            info!("node {} disposed", node_id);
        }
        Ok(())
    }

    pub async fn dispose_all(&self) -> Result<()> {
        let node_ids: Vec<String> = self.processes.iter().map(|e| e.key().clone()).collect();
        for node_id in node_ids {
            self.dispose(&node_id).await?;
        }
        Ok(())
    }

    async fn init_node(&self, manifest: &NodeManifest) -> Result<()> {
        info!("initializing persistent node {}", manifest.id);

        let mut cmd = Self::build_command(manifest)?;
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn()?;

        let stdin = child.stdin.take()
            .ok_or_else(|| anyhow::anyhow!("failed to get stdin for node {}", manifest.id))?;
        let stdout = child.stdout.take()
            .ok_or_else(|| anyhow::anyhow!("failed to get stdout for node {}", manifest.id))?;
        let stderr = child.stderr.take();

        let stdin = Arc::new(Mutex::new(stdin));
        let pending: Arc<DashMap<String, PendingRequest>> = Arc::new(DashMap::new());

        Self::spawn_reader(stdout, Arc::clone(&pending), manifest.id.clone());
        Self::spawn_stderr_logger(stderr, manifest.id.clone());

        self.processes.insert(manifest.id.clone(), NodeProcess {
            stdin: Arc::clone(&stdin),
            pending: Arc::clone(&pending),
        });

        self.send_lifecycle(
            &manifest.id,
            LifecycleHook::OnInit,
            Some(serde_json::to_value(&manifest.config)?),
        ).await?;

        info!("node {} ready", manifest.id);
        Ok(())
    }

    async fn send_lifecycle(
        &self,
        node_id: &str,
        hook: LifecycleHook,
        data: Option<serde_json::Value>,
    ) -> Result<()> {
        let request_id = uuid::Uuid::new_v4().to_string();
        let (tx, rx) = oneshot::channel();

        if let Some(process) = self.processes.get(node_id) {
            process.pending.insert(request_id.clone(), PendingRequest { tx });

            let msg = serde_json::json!({
                "jsonrpc": "2.0",
                "method": "lifecycle",
                "id": request_id,
                "params": {
                    "hook": hook,
                    "data": data,
                }
            });

            Self::write_line(&process.stdin, &msg).await?;
            let _ = rx.await;
        }

        Ok(())
    }

    fn spawn_reader(
        stdout: tokio::process::ChildStdout,
        pending: Arc<DashMap<String, PendingRequest>>,
        node_id: String,
    ) {
        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                match serde_json::from_str::<serde_json::Value>(&line) {
                    Ok(value) => {
                        let id = value
                            .get("id")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string());

                        if let Some(id) = id {
                            if let Some((_, req)) = pending.remove(&id) {
                                let result = value
                                    .get("result")
                                    .cloned()
                                    .unwrap_or(serde_json::Value::Null);
                                let _ = req.tx.send(result);
                            }
                        }
                    }
                    Err(e) => error!("failed to parse response from node {}: {}", node_id, e),
                }
            }
        });
    }

    fn spawn_stderr_logger(
        stderr: Option<tokio::process::ChildStderr>,
        node_id: String,
    ) {
        if let Some(stderr) = stderr {
            tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    error!("[node {}] {}", node_id, line);
                }
            });
        }
    }

    async fn write_line(
        stdin: &Arc<Mutex<tokio::process::ChildStdin>>,
        msg: &serde_json::Value,
    ) -> Result<()> {
        let mut line = serde_json::to_string(msg)?;
        line.push('\n');
        stdin.lock().await.write_all(line.as_bytes()).await?;
        Ok(())
    }

    fn build_command(manifest: &NodeManifest) -> Result<Command> {
        match &manifest.executor {
            Executor::Python => {
                let mut c = Command::new("python3");
                c.arg(&manifest.entry);
                Ok(c)
            }
            Executor::Node => {
                let mut c = Command::new("node");
                c.arg(&manifest.entry);
                Ok(c)
            }
            Executor::Binary => Ok(Command::new(&manifest.entry)),
            other => anyhow::bail!("persistent runtime does not support executor {:?}", other),
        }
    }

    fn parse_emit_result(value: serde_json::Value) -> Result<Vec<PersistentResult>> {
        let execute = value
            .get("execute")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        if !execute {
            return Ok(vec![]);
        }

        let emissions = value
            .get("emit")
            .and_then(|e| e.as_object())
            .ok_or_else(|| anyhow::anyhow!("response missing 'emit' object"))?;

        Ok(emissions
            .iter()
            .map(|(port, data)| PersistentResult {
                port: port.clone(),
                data: data.clone(),
            })
            .collect())
    }
}