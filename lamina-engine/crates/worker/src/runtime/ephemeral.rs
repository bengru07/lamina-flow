use anyhow::Result;
use std::collections::HashMap;
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::AsyncWriteExt;
use lamina_core::manifest::{NodeManifest, Executor};

#[derive(Debug)]
pub struct EphemeralResult {
    pub port: String,
    pub data: serde_json::Value,
}

pub struct EphemeralRuntime;

impl EphemeralRuntime {
    pub async fn execute(
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: HashMap<String, serde_json::Value>,
    ) -> Result<Vec<EphemeralResult>> {
        let mut cmd = Self::build_command(manifest)?;

        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn()?;

        let payload = serde_json::json!({
            "execution_id": execution_id,
            "inputs": inputs,
            "config": manifest.config,
        });

        if let Some(stdin) = child.stdin.as_mut() {
            stdin.write_all(serde_json::to_string(&payload)?.as_bytes()).await?;
            stdin.write_all(b"\n").await?;
        }

        let output = child.wait_with_output().await?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("ephemeral node exited with error: {}", stderr);
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let value: serde_json::Value = serde_json::from_str(stdout.trim())?;

        Self::parse_emit_result(value)
    }

    fn build_command(manifest: &NodeManifest) -> Result<Command> {
        let mut cmd = match &manifest.executor {
            Executor::Python => {
                let mut c = Command::new("python3");
                c.arg(&manifest.entry);
                c
            }
            Executor::Node => {
                let mut c = Command::new("node");
                c.arg(&manifest.entry);
                c
            }
            Executor::Binary => {
                Command::new(&manifest.entry)
            }
            other => anyhow::bail!("ephemeral runtime does not support executor {:?}", other),
        };
        Ok(cmd)
    }

    fn parse_emit_result(value: serde_json::Value) -> Result<Vec<EphemeralResult>> {
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
            .map(|(port, data)| EphemeralResult {
                port: port.clone(),
                data: data.clone(),
            })
            .collect())
    }
}