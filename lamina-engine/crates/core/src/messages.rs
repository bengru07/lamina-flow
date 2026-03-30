use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::state::{NodeLifecycle, ExecutionNodeState, ExecutionState};
use crate::workflow::Workflow;
use crate::manifest::NodeManifest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecuteWorkflowMsg {
    pub execution_id: String,
    pub workflow: Workflow,
    pub inputs: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriggerNodeMsg {
    pub execution_id: String,
    pub node_id: String,
    pub inputs: HashMap<String, serde_json::Value>,
    pub manifest: Option<NodeManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeEmitMsg {
    pub execution_id: String,
    pub node_id: String,
    pub port: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeStateMsg {
    pub execution_id: String,
    pub node_id: String,
    pub lifecycle: NodeLifecycle,
    pub execution_state: ExecutionNodeState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStateMsg {
    pub execution_id: String,
    pub state: ExecutionState,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogMsg {
    pub execution_id: String,
    pub node_id: Option<String>,
    pub level: LogLevel,
    pub message: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeExecutionStatus {
    pub node_id: String,
    pub lifecycle: NodeLifecycle,
    pub execution_state: ExecutionNodeState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStatus {
    pub execution_id: String,
    pub state: ExecutionState,
    pub nodes: Vec<NodeExecutionStatus>,
}