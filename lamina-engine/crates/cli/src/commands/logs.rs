use anyhow::Result;

pub async fn execute(execution_id: &str) -> Result<()> {
    let api = api_base();
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/executions/{}/logs", api, execution_id))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("failed to connect to engine: {}", e))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        println!("execution {} not found", execution_id);
        return Ok(());
    }

    let logs: serde_json::Value = response.json().await?;

    if let Some(entries) = logs.as_array() {
        if entries.is_empty() {
            println!("no logs found for execution {}", execution_id);
            return Ok(());
        }
        for entry in entries {
            println!(
                "[{}] {} {}",
                entry["timestamp"].as_str().unwrap_or("?"),
                entry["level"].as_str().unwrap_or("?").to_uppercase(),
                entry["message"].as_str().unwrap_or("?"),
            );
        }
    }

    Ok(())
}

fn api_base() -> String {
    std::env::var("LAMINA_API").unwrap_or_else(|_| "http://localhost:3000".to_string())
}