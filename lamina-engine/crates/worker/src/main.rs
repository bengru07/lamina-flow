use anyhow::Result;
use std::path::PathBuf;
use std::sync::Arc;
use tracing::info;

mod config;
mod nats;
mod registry;
mod worker;
mod runtime;
mod dispatcher;
mod logger;
mod shutdown;

#[tokio::main]
async fn main() -> Result<()> {
    let _ = dotenvy::dotenv();
    tracing_subscriber::fmt::init();

    let args: Vec<String> = std::env::args().collect();
    let nodes_dir = args.windows(2).find_map(|w| {
        if w[0] == "--nodes-dir" {
            Some(PathBuf::from(&w[1]))
        } else {
            None
        }
    });

    let cfg = config::WorkerConfig::from_env().with_nodes_dir(nodes_dir);

    info!("connecting to NATS at {}", cfg.nats_url);
    let nats = nats::NatsClient::connect(&cfg.nats_url).await?;

    let log_adapter = match (
        std::env::var("LOG_ADAPTER").ok().filter(|s| !s.is_empty()),
        std::env::var("LOG_URL").ok().filter(|s| !s.is_empty()),
    ) {
        (Some(adapter), Some(url)) => {
            info!("initializing log adapter: {}", adapter);
            Some(logger::build_adapter(&adapter, &url).await?)
        }
        _ => {
            info!("no log adapter configured");
            None
        }
    };

    let registry = Arc::new(registry::NodeRegistry::new(cfg.nodes_dir.as_ref()));
    let worker = Arc::new(worker::Worker::new(nats.clone(), registry, cfg.nodes_dir.clone()));
    let log_writer = Arc::new(logger::Logger::new(nats.clone(), log_adapter));
    let persistent = worker.persistent();

    tokio::select! {
        _ = shutdown::wait_for_signal() => {
            shutdown::shutdown_worker(persistent).await?;
        }
        result = async {
            let worker_handle = tokio::spawn({
                let worker = Arc::clone(&worker);
                async move { worker.start().await }
            });
            let logger_handle = tokio::spawn({
                let log_writer = Arc::clone(&log_writer);
                async move { log_writer.start().await }
            });
            tokio::try_join!(worker_handle, logger_handle)
        } => {
            if let Err(e) = result {
                tracing::error!("worker error: {}", e);
            }
        }
    }

    Ok(())
}