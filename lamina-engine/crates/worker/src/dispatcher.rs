use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use tracing::{info, error};

use lamina_core::manifest::{NodeManifest, Runtime};
use lamina_core::messages::{NodeEmitMsg, NodeStateMsg};
use lamina_core::state::{NodeLifecycle, ExecutionNodeState};

use crate::nats::NatsClient;
use crate::runtime::ephemeral::EphemeralRuntime;
use crate::runtime::persistent::PersistentRuntime;
use crate::runtime::endpoint::EndpointRuntime;

pub struct Dispatcher {
    nats: NatsClient,
    persistent: Arc<PersistentRuntime>,
    nodes_dir: Option<PathBuf>,
}

impl Dispatcher {
    pub fn new(nats: NatsClient, persistent: Arc<PersistentRuntime>, nodes_dir: Option<PathBuf>) -> Self {
        Self { nats, persistent, nodes_dir }
    }

    pub async fn dispatch(
        &self,
        node_id: &str,
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: std::collections::HashMap<String, serde_json::Value>,
    ) -> Result<()> {
        let mut manifest = manifest.clone();
        self.resolve_entry(&mut manifest);

        info!("dispatching node {} for execution {}", manifest.id, execution_id);
        self.publish_node_state(node_id, execution_id, NodeLifecycle::Triggered, ExecutionNodeState::Running).await?;

        let results = match &manifest.runtime {
            Runtime::Ephemeral => {
                EphemeralRuntime::execute(&manifest, execution_id, inputs).await
                    .map(|r| r.into_iter().map(|e| (e.port, e.data)).collect::<Vec<_>>())
            }
            Runtime::Persistent => {
                self.persistent.execute(&manifest, execution_id, inputs).await
                    .map(|r| r.into_iter().map(|e| (e.port, e.data)).collect::<Vec<_>>())
            }
            Runtime::Endpoint => {
                EndpointRuntime::execute(&manifest, execution_id, inputs).await
                    .map(|r| r.into_iter().map(|e| (e.port, e.data)).collect::<Vec<_>>())
            }
        };

        match results {
            Ok(emissions) => {
                for (port, data) in emissions {
                    let msg = NodeEmitMsg {
                        execution_id: execution_id.to_string(),
                        node_id: node_id.to_string(),
                        port,
                        data,
                    };
                    self.nats.publish_emit(&msg).await?;
                }
                self.publish_node_state(node_id, execution_id, NodeLifecycle::Emitting, ExecutionNodeState::Done).await?;
            }
            Err(e) => {
                error!("node {} failed in execution {}: {}", node_id, execution_id, e);
                self.publish_node_state(node_id, execution_id, NodeLifecycle::Errored, ExecutionNodeState::Failed).await?;
            }
        }

        Ok(())
    }
    
    fn resolve_entry(&self, manifest: &mut NodeManifest) {
        if std::path::Path::new(&manifest.entry).is_absolute() {
            return;
        }
        if let Some(base) = &self.nodes_dir {
            manifest.entry = base.join(&manifest.entry)
                .to_string_lossy()
                .to_string();
        }
    }

    async fn publish_node_state(
        &self,
        node_id: &str,
        execution_id: &str,
        lifecycle: NodeLifecycle,
        execution_state: ExecutionNodeState,
    ) -> Result<()> {
        let msg = NodeStateMsg {
            execution_id: execution_id.to_string(),
            node_id: node_id.to_string(),
            lifecycle,
            execution_state,
        };
        self.nats.publish_node_state(&msg).await?;
        Ok(())
    }
}