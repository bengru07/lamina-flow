use anyhow::Result;

pub async fn execute(execution_id: &str) -> Result<()> {
    let api = api_base();
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/executions/{}", api, execution_id))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("failed to connect to engine: {}", e))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        println!("execution {} not found (may have completed and been cleared)", execution_id);
        return Ok(());
    }

    let result: serde_json::Value = response.json().await?;

    println!("execution: {}", execution_id);
    println!("state:     {}", result["state"].as_str().unwrap_or("unknown"));
    println!();
    println!("nodes:");

    if let Some(nodes) = result["nodes"].as_array() {
        for node in nodes {
            println!(
                "  {} — {}",
                node["node_id"].as_str().unwrap_or("?"),
                node["execution_state"].as_str().unwrap_or("?"),
            );
        }
    }

    Ok(())
}

fn api_base() -> String {
    std::env::var("LAMINA_API").unwrap_or_else(|_| "http://localhost:3000".to_string())
}