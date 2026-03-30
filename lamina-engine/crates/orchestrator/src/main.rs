use anyhow::Result;
use std::sync::Arc;
use tracing::info;
use tower_http::cors::{CorsLayer, Any};

mod execution;
mod nats;
mod orchestrator;
mod api;
mod shutdown;

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();

    let nats_url = std::env::var("NATS_URL")
        .unwrap_or_else(|_| "nats://localhost:4222".to_string());
    let rest_addr = std::env::var("REST_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:3000".to_string());

    info!("connecting to NATS at {}", nats_url);
    let nats = nats::NatsClient::connect(&nats_url).await?;
    let orch = Arc::new(orchestrator::Orchestrator::new(nats));

    let app_state = api::rest::AppState {
        orchestrator: Arc::clone(&orch),
    };

    let router = api::rest::router(app_state)
    .layer(CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any));
    let listener = tokio::net::TcpListener::bind(&rest_addr).await?;

    info!("REST API listening on {}", rest_addr);

    tokio::select! {
        _ = shutdown::wait_for_signal() => {
            shutdown::shutdown_orchestrator(Arc::clone(&orch)).await?;
        }
        result = async {
            let orch_handle = tokio::spawn({
                let orch = Arc::clone(&orch);
                async move { orch.start().await }
            });
            let api_handle = tokio::spawn(async move {
                axum::serve(listener, router).await.map_err(anyhow::Error::from)
            });
            tokio::try_join!(
                async { orch_handle.await? },
                async { api_handle.await? },
            )
        } => {
            if let Err(e) = result {
                tracing::error!("orchestrator error: {}", e);
            }
        }
    }

    Ok(())
}