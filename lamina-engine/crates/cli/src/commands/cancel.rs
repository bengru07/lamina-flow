use anyhow::Result;

pub async fn execute(execution_id: &str) -> Result<()> {
    let api = api_base();
    let client = reqwest::Client::new();

    let response = client
        .delete(format!("{}/executions/{}", api, execution_id))
        .send()
        .await
        .map_err(|e| anyhow::anyhow!("failed to connect to engine: {}", e))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        println!("execution {} not found", execution_id);
        return Ok(());
    }

    if response.status().is_success() {
        println!("execution {} cancelled", execution_id);
    } else {
        anyhow::bail!("failed to cancel execution: {}", response.status());
    }

    Ok(())
}

fn api_base() -> String {
    std::env::var("LAMINA_API").unwrap_or_else(|_| "http://localhost:3000".to_string())
}