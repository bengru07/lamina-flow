use anyhow::Result;
use std::sync::Arc;
use tracing::info;

use crate::orchestrator::Orchestrator;

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

pub async fn shutdown_orchestrator(orch: Arc<Orchestrator>) -> Result<()> {
    info!("cancelling running executions");

    let execution_ids: Vec<String> = orch.executions
        .iter()
        .map(|e| e.key().clone())
        .collect();

    for id in execution_ids {
        if let Err(e) = orch.cancel_execution(&id).await {
            tracing::warn!("failed to cancel execution {}: {}", id, e);
        }
    }

    info!("orchestrator shutdown complete");
    Ok(())
}