use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::manifest::NodeManifest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortRef {
    pub node_id: String,
    pub port: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum EdgeKind {
    Data,
    Trigger,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub from: PortRef,
    pub to: PortRef,
    pub kind: EdgeKind,
    #[serde(default)]
    pub feedback: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub manifest: NodeManifest,
    pub config_override: HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub version: String,
    pub name: String,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<Edge>,
}