use anyhow::Result;
use std::sync::Arc;
use tracing::info;

use crate::runtime::persistent::PersistentRuntime;

pub async fn wait_for_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install CTRL+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    info!("shutdown signal received");
}

pub async fn shutdown_worker(persistent: Arc<PersistentRuntime>) -> Result<()> {
    info!("disposing persistent nodes");
    persistent.dispose_all().await?;
    info!("worker shutdown complete");
    Ok(())
}