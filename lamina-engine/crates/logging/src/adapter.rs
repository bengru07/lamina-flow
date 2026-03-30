use anyhow::Result;
use async_trait::async_trait;
use lamina_core::messages::{LogMsg, LogLevel};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct LogEntry {
    pub id: String,
    pub execution_id: String,
    pub node_id: Option<String>,
    pub level: LogLevel,
    pub message: String,
    pub timestamp: DateTime<Utc>,
}

#[async_trait]
pub trait LogAdapter: Send + Sync {
    async fn init(&self) -> Result<()>;
    async fn write(&self, entry: &LogEntry) -> Result<()>;
    async fn query_execution(&self, execution_id: &str) -> Result<Vec<LogEntry>>;
    async fn query_node(&self, execution_id: &str, node_id: &str) -> Result<Vec<LogEntry>>;
}

impl From<&LogMsg> for LogEntry {
    fn from(msg: &LogMsg) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            execution_id: msg.execution_id.clone(),
            node_id: msg.node_id.clone(),
            level: msg.level.clone(),
            message: msg.message.clone(),
            timestamp: msg.timestamp,
        }
    }
}