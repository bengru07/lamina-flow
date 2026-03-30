use anyhow::Result;
use futures_util::StreamExt;
use bytes::Bytes;

pub async fn execute(execution_id: &str) -> Result<()> {
    let api = api_base();

    println!("watching execution {}...", execution_id);
    println!("(press Ctrl+C to stop)\n");

    let response = reqwest::Client::new()
        .get(format!("{}/executions/{}/stream", api, execution_id))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("failed to connect to engine: {}", e))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        println!("execution {} not found (may have already completed)", execution_id);
        return Ok(());
    }

    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk: Bytes = chunk?;
        let text = String::from_utf8_lossy(&chunk);

       for line in text.lines() {
            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(event) = serde_json::from_str::<serde_json::Value>(data) {
                    match event["type"].as_str() {
                        Some("node_state") => {
                            let node_id = event["node_id"].as_str().unwrap_or("?");
                            let state = event["state"].as_str().unwrap_or("?");
                            println!("  node {} → {}", node_id, state);
                        }
                        Some("execution_done") => {
                            println!("\nexecution completed");
                            return Ok(());
                        }
                        _ => {}
                    }
                }
            }
        }
    }

    println!("\nexecution completed");
    Ok(())
}

fn api_base() -> String {
    std::env::var("LAMINA_API").unwrap_or_else(|_| "http://localhost:3000".to_string())
}