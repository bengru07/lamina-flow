use anyhow::Result;
use async_trait::async_trait;
use sqlx::PgPool;
use lamina_core::messages::LogLevel;
use crate::adapter::{LogAdapter, LogEntry};

pub struct PostgresAdapter {
    pool: PgPool,
}

impl PostgresAdapter {
    pub async fn new(url: &str) -> Result<Self> {
        let pool = PgPool::connect(url).await?;
        Ok(Self { pool })
    }
}

#[async_trait]
impl LogAdapter for PostgresAdapter {
    async fn init(&self) -> Result<()> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS logs (
                id TEXT PRIMARY KEY,
                execution_id TEXT NOT NULL,
                node_id TEXT,
                level TEXT NOT NULL,
                message TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL
            )"
        )
        .execute(&self.pool)
        .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_logs_execution_id ON logs (execution_id)")
            .execute(&self.pool)
            .await?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_logs_node_id ON logs (node_id)")
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn write(&self, entry: &LogEntry) -> Result<()> {
        sqlx::query(
            "INSERT INTO logs (id, execution_id, node_id, level, message, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(&entry.id)
        .bind(&entry.execution_id)
        .bind(&entry.node_id)
        .bind(level_to_str(&entry.level))
        .bind(&entry.message)
        .bind(entry.timestamp)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn query_execution(&self, execution_id: &str) -> Result<Vec<LogEntry>> {
        let rows = sqlx::query_as::<_, LogRow>(
            "SELECT * FROM logs WHERE execution_id = $1 ORDER BY timestamp ASC"
        )
        .bind(execution_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn query_node(&self, execution_id: &str, node_id: &str) -> Result<Vec<LogEntry>> {
        let rows = sqlx::query_as::<_, LogRow>(
            "SELECT * FROM logs WHERE execution_id = $1 AND node_id = $2 ORDER BY timestamp ASC"
        )
        .bind(execution_id)
        .bind(node_id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }
}

#[derive(sqlx::FromRow)]
struct LogRow {
    id: String,
    execution_id: String,
    node_id: Option<String>,
    level: String,
    message: String,
    timestamp: chrono::DateTime<chrono::Utc>,
}

impl From<LogRow> for LogEntry {
    fn from(row: LogRow) -> Self {
        Self {
            id: row.id,
            execution_id: row.execution_id,
            node_id: row.node_id,
            level: str_to_level(&row.level),
            message: row.message,
            timestamp: row.timestamp,
        }
    }
}

fn level_to_str(level: &LogLevel) -> &'static str {
    match level {
        LogLevel::Debug => "debug",
        LogLevel::Info => "info",
        LogLevel::Warn => "warn",
        LogLevel::Error => "error",
    }
}

fn str_to_level(s: &str) -> LogLevel {
    match s {
        "debug" => LogLevel::Debug,
        "warn" => LogLevel::Warn,
        "error" => LogLevel::Error,
        _ => LogLevel::Info,
    }
}