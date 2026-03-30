use anyhow::Result;
use std::collections::HashMap;
use lamina_core::manifest::{NodeManifest, Executor};

pub struct EndpointRuntime;

#[derive(Debug)]
pub struct EndpointResult {
    pub port: String,
    pub data: serde_json::Value,
}

impl EndpointRuntime {
    pub async fn execute(
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: HashMap<String, serde_json::Value>,
    ) -> Result<Vec<EndpointResult>> {
        match &manifest.executor {
            Executor::Http => Self::execute_http(manifest, execution_id, inputs).await,
            Executor::WebSocket => Self::execute_websocket(manifest, execution_id, inputs).await,
            other => anyhow::bail!("endpoint runtime does not support executor {:?}", other),
        }
    }

    async fn execute_http(
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: HashMap<String, serde_json::Value>,
    ) -> Result<Vec<EndpointResult>> {
        let client = reqwest::Client::new();

        let method = manifest.config
            .get("method")
            .and_then(|v| v.as_str())
            .unwrap_or("POST")
            .to_uppercase();

        let url = &manifest.entry;

        let body = serde_json::json!({
            "execution_id": execution_id,
            "inputs": inputs,
        });

        let response = match method.as_str() {
            "GET" => client.get(url).json(&body).send().await?,
            "POST" => client.post(url).json(&body).send().await?,
            "PUT" => client.put(url).json(&body).send().await?,
            other => anyhow::bail!("unsupported HTTP method: {}", other),
        };

        if !response.status().is_success() {
            anyhow::bail!("endpoint returned status {}", response.status());
        }

        let result: serde_json::Value = response.json().await?;
        Self::parse_emit_result(result)
    }

    async fn execute_websocket(
        manifest: &NodeManifest,
        execution_id: &str,
        inputs: HashMap<String, serde_json::Value>,
    ) -> Result<Vec<EndpointResult>> {
        use tokio_tungstenite::connect_async;
        use tokio_tungstenite::tungstenite::Message;
        use futures_util::{SinkExt, StreamExt};

        let (mut ws, _) = connect_async(&manifest.entry).await?;

        let payload = serde_json::json!({
            "execution_id": execution_id,
            "inputs": inputs,
        });

        ws.send(Message::Text(payload.to_string())).await?;

        while let Some(msg) = ws.next().await {
            let msg = msg?;
            if let Message::Text(text) = msg {
                let value: serde_json::Value = serde_json::from_str(&text)?;
                if value.get("done").and_then(|v| v.as_bool()).unwrap_or(false) {
                    return Self::parse_emit_result(value);
                }
            }
        }

        anyhow::bail!("websocket closed without a done message")
    }

    fn parse_emit_result(value: serde_json::Value) -> Result<Vec<EndpointResult>> {
        let emissions = value
            .get("emit")
            .and_then(|e| e.as_object())
            .ok_or_else(|| anyhow::anyhow!("response missing 'emit' object"))?;

        Ok(emissions
            .iter()
            .map(|(port, data)| EndpointResult {
                port: port.clone(),
                data: data.clone(),
            })
            .collect())
    }
}