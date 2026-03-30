use anyhow::Result;
use crate::commands::watch;

pub async fn execute(path: &str, inputs_path: Option<&str>, watch_flag: bool) -> Result<()> {
    let api = api_base();

    let workflow_path = if path == "." {
        find_workflow_in_dir(".")?
    } else {
        path.to_string()
    };

    let workflow_content = std::fs::read_to_string(&workflow_path)
        .map_err(|e| anyhow::anyhow!("failed to read workflow file {}: {}", workflow_path, e))?;

    let mut payload: serde_json::Value = serde_json::from_str(&workflow_content)
        .map_err(|e| anyhow::anyhow!("failed to parse workflow file: {}", e))?;

    if let Some(inputs_path) = inputs_path {
        let inputs_content = std::fs::read_to_string(inputs_path)
            .map_err(|e| anyhow::anyhow!("failed to read inputs file {}: {}", inputs_path, e))?;
        let inputs: serde_json::Value = serde_json::from_str(&inputs_content)?;
        payload["inputs"] = inputs;
    }

    let execution_id = uuid::Uuid::new_v4().to_string();
    payload["execution_id"] = serde_json::Value::String(execution_id.clone());

    println!("execution started: {}", execution_id);
    println!("  watch:  lamina watch {}", execution_id);
    println!("  status: lamina status {}", execution_id);
    println!("  logs:   lamina logs {}", execution_id);

    if watch_flag {
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/executions", api))
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow::anyhow!("failed to connect to engine at {}: {}", api, e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("engine returned {}: {}", status, body);
        }

        println!();
        watch::execute(&execution_id).await?;
    } else {
        let client = reqwest::Client::new();
        let response = client
            .post(format!("{}/executions", api))
            .json(&payload)
            .send()
            .await
            .map_err(|e| anyhow::anyhow!("failed to connect to engine at {}: {}", api, e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("engine returned {}: {}", status, body);
        }
    }

    Ok(())
}

fn find_workflow_in_dir(dir: &str) -> Result<String> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            let content = std::fs::read_to_string(&path)?;
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&content) {
                if v.get("workflow").is_some() {
                    return Ok(path.to_string_lossy().to_string());
                }
            }
        }
    }
    anyhow::bail!("no workflow file found in directory: {}", dir)
}

fn api_base() -> String {
    std::env::var("LAMINA_API").unwrap_or_else(|_| "http://localhost:3000".to_string())
}