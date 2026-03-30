use anyhow::Result;
use std::sync::Arc;
use futures_util::StreamExt;
use tracing::error;

use lamina_core::messages::LogMsg;
use logging::adapter::{LogAdapter, LogEntry};

use crate::nats::NatsClient;

pub struct Logger {
    nats: NatsClient,
    adapter: Option<Arc<dyn LogAdapter>>,
}

impl Logger {
    pub fn new(nats: NatsClient, adapter: Option<Arc<dyn LogAdapter>>) -> Self {
        Self { nats, adapter }
    }

    pub async fn start(self: Arc<Self>) -> Result<()> {
        let mut sub = self.nats.subscribe_logs().await?;

        while let Some(msg) = sub.next().await {
            let this = Arc::clone(&self);
            tokio::spawn(async move {
                match serde_json::from_slice::<LogMsg>(&msg.payload) {
                    Ok(log_msg) => {
                        if let Err(e) = this.handle_log(log_msg).await {
                            error!("failed to write log entry: {}", e);
                        }
                    }
                    Err(e) => error!("failed to deserialize log message: {}", e),
                }
            });
        }

        Ok(())
    }

    async fn handle_log(&self, msg: LogMsg) -> Result<()> {
        if let Some(adapter) = &self.adapter {
            let entry = LogEntry::from(&msg);
            adapter.write(&entry).await?;
        }
        Ok(())
    }
}

pub async fn build_adapter(
    adapter_type: &str,
    url: &str,
) -> Result<Arc<dyn LogAdapter>> {
    match adapter_type {
        "postgres" => {
            let adapter = logging::postgres::PostgresAdapter::new(url).await?;
            adapter.init().await?;
            Ok(Arc::new(adapter))
        }
        "sqlite" => {
            let adapter = logging::sqlite::SqliteAdapter::new(url).await?;
            adapter.init().await?;
            Ok(Arc::new(adapter))
        }
        other => anyhow::bail!("unknown log adapter: {}", other),
    }
}