use anyhow::Result;
use async_nats::Client;
use async_nats::jetstream::{self, stream::Config as StreamConfig, consumer::push::Config as ConsumerConfig};
use futures_util::StreamExt;
use lamina_core::messages::{NodeEmitMsg, NodeStateMsg};
use lamina_core::subjects;

#[derive(Clone)]
pub struct NatsClient {
    client: Client,
    jetstream: jetstream::Context,
}

pub type TriggerStream = async_nats::jetstream::consumer::push::Messages;

impl NatsClient {
    pub async fn connect(url: &str) -> Result<Self> {
        let client = async_nats::ConnectOptions::new()
            .max_reconnects(0)
            .connect(url)
            .await?;
        let jetstream = jetstream::new(client.clone());
        Ok(Self { client, jetstream })
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

    pub async fn subscribe_triggers(
        &self,
    ) -> Result<TriggerStream> {
        let stream = self.jetstream.get_stream("TRIGGERS").await?;
        let consumer = stream
            .get_or_create_consumer("workers", async_nats::jetstream::consumer::push::Config {
                durable_name: Some("workers".to_string()),
                deliver_subject: self.client.new_inbox(),
                ..Default::default()
            })
            .await?;
        Ok(consumer.messages().await?)
    }

    pub async fn publish_trigger(&self, payload: Vec<u8>) -> Result<()> {
        self.jetstream
            .publish("lamina.triggers", payload.into())
            .await?
            .await?;
        Ok(())
    }

    pub async fn publish_emit(&self, msg: &NodeEmitMsg) -> Result<()> {
        let subject = subjects::node_emit(&msg.node_id, &msg.port);
        let payload = serde_json::to_vec(msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn publish_node_state(&self, msg: &NodeStateMsg) -> Result<()> {
        let subject = subjects::node_state(&msg.node_id);
        let payload = serde_json::to_vec(msg)?;
        self.client.publish(subject, payload.into()).await?;
        Ok(())
    }

    pub async fn subscribe_logs(&self) -> Result<async_nats::Subscriber> {
        Ok(self.client.subscribe("lamina.execution.*.log").await?)
    }
}