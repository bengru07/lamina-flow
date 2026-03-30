use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Runtime {
    Persistent,
    Ephemeral,
    Endpoint,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Executor {
    Python,
    Node,
    Binary,
    Http,
    WebSocket,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Protocol {
    JsonRpc,
    Stdio,
    Socket,
    Http,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeManifest {
    pub id: String,
    pub version: String,
    pub runtime: Runtime,
    pub executor: Executor,
    pub protocol: Protocol,
    pub entry: String,
    pub init: Option<String>,
    pub inputs: Vec<String>,
    pub outputs: Vec<String>,
    pub config: HashMap<String, serde_json::Value>,
    #[serde(default)]
    pub eager_init: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LifecycleHook {
    OnInit,
    OnReady,
    OnTrigger,
    OnDispose,
    OnError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LifecycleMsg {
    pub hook: LifecycleHook,
    pub execution_id: Option<String>,
    pub data: Option<serde_json::Value>,
}