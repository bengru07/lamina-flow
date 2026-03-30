use anyhow::Result;
use async_nats::Client;
use async_nats::jetstream::{self, stream::Config as StreamConfig};
use lamina_core::messages::{TriggerNodeMsg, ExecutionStateMsg, LogMsg};
use lamina_core::subjects;

#[derive(Clone)]
pub struct NatsClient {
    client: Client,
    jetstream: jetstream::Context,
}

impl NatsClient {
    pub async fn connect(url: &str) -> Result<Self> {
        let client = async_nats::ConnectOptions::new()
            .max_reconnects(0)
            .connect(url)
            .await?;
        let jetstream = jetstream::new(client.clone());
        Ok(Self { client, jetstream })
    }

    pub fn client(&self) -> &Client {
        &self.client
    }

    pub async fn setup_triggers_stream(&self) -> Result<()> {
        self.jetstream
            .get_or_create_stream(StreamConfig {
                name: "TRIGGERS".to_string(),
                subjects: vec!["lamina.triggers".to_string()],
                ..Default::default()
            })
            .await?;
        Ok(())
    }

    pub async fn publish_trigger(&self, msg: &TriggerNodeMsg) -> Result<()> {
        let payload = serde_json::to_vec(msg)?;
        self.jetstream
            .publish("lamina.triggers", payload.into())
            .await?
            .await?;
        Ok(())
    }

    pub async fn publish_execution_state(&self, msg: &ExecutionStateMsg) -> Result<()> {
        let subject = subjects::workflow_state(&msg.execution_id);
        let payload = serde_json::to_vec(msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_log(&self, msg: &LogMsg) -> Result<()> {
        let subject = subjects::execution_log(&msg.execution_id);
        let payload = serde_json::to_vec(msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn subscribe_emit(&self, node_id: &str) -> Result<async_nats::Subscriber> {
        let subject = format!("lamina.node.{}.emit.>", node_id);
        Ok(self.client.subscribe(subject).await?)
    }

    pub async fn subscribe_workflow_execute(&self) -> Result<async_nats::Subscriber> {
        Ok(self.client.subscribe("lamina.workflow.>").await?)
    }
}