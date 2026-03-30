use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use futures_util::StreamExt;
use tracing::{info, error};
use dashmap::DashSet;

use lamina_core::messages::TriggerNodeMsg;

use crate::nats::NatsClient;
use crate::registry::NodeRegistry;
use crate::dispatcher::Dispatcher;
use crate::runtime::persistent::PersistentRuntime;

pub struct Worker {
    nats: NatsClient,
    registry: Arc<NodeRegistry>,
    dispatcher: Arc<Dispatcher>,
    persistent: Arc<PersistentRuntime>,
    in_flight: Arc<DashSet<String>>,
}

impl Worker {
    pub fn new(nats: NatsClient, registry: Arc<NodeRegistry>, nodes_dir: Option<PathBuf>) -> Self {
        let persistent = Arc::new(PersistentRuntime::new());
        let dispatcher = Arc::new(Dispatcher::new(
            nats.clone(),
            Arc::clone(&persistent),
            nodes_dir,
        ));
        Self {
            nats,
            registry,
            dispatcher,
            persistent,
            in_flight: Arc::new(DashSet::new()),
        }
    }

    pub fn persistent(&self) -> Arc<PersistentRuntime> {
        Arc::clone(&self.persistent)
    }

    pub async fn boot_workflow(&self, manifests: &[lamina_core::manifest::NodeManifest]) -> Result<()> {
        self.persistent.boot_eager_nodes(manifests).await
    }

    pub async fn start(self: Arc<Self>) -> Result<()> {
        info!("worker starting");

        self.nats.setup_triggers_stream().await?;
        let mut sub: crate::nats::TriggerStream = self.nats.subscribe_triggers().await?;

        while let Some(msg) = sub.next().await {
            let msg = match msg {
                Ok(m) => m,
                Err(e) => {
                    error!("error receiving trigger: {}", e);
                    continue;
                }
            };

            let payload = msg.payload.clone();

            if let Err(e) = msg.ack().await {
                error!("failed to ack message: {}", e);
                continue;
            }

            let this = Arc::clone(&self);
            tokio::spawn(async move {
                match serde_json::from_slice::<TriggerNodeMsg>(&payload) {
                    Ok(trigger) => {
                        if let Err(e) = this.handle_trigger(trigger).await {
                            error!("trigger handling error: {}", e);
                        }
                    }
                    Err(e) => error!("failed to deserialize trigger: {}", e),
                }
            });
        }

        Ok(())
    }

    async fn handle_trigger(self: &Arc<Self>, msg: TriggerNodeMsg) -> Result<()> {
        let dedup_key = format!("{}:{}", msg.execution_id, msg.node_id);

        if !self.in_flight.insert(dedup_key.clone()) {
            tracing::debug!("dropping duplicate trigger for {} in {}", msg.node_id, msg.execution_id);
            return Ok(());
        }

        info!("received trigger for node {} in execution {}", msg.node_id, msg.execution_id);

        let manifest = match self.find_manifest(&msg) {
            Some(m) => m,
            None => {
                error!("no manifest found for node {}", msg.node_id);
                self.in_flight.remove(&dedup_key);
                return Ok(());
            }
        };

        let result = self.dispatcher.dispatch(&msg.node_id, &manifest, &msg.execution_id, msg.inputs).await;
        self.in_flight.remove(&dedup_key);
        result
    }

    fn find_manifest(&self, msg: &TriggerNodeMsg) -> Option<lamina_core::manifest::NodeManifest> {
        msg.manifest.as_ref().map(|m| self.registry.resolve(&msg.node_id, m))
    }
}