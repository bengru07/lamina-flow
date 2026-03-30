use std::collections::HashMap;
use dashmap::DashMap;
use lamina_core::state::{ExecutionState, ExecutionNodeState};
use lamina_core::dag::ResolvedDag;
use lamina_core::workflow::Workflow;
use std::sync::Arc;

#[derive(Debug, Clone)]
pub struct NodeExecutionContext {
    pub state: ExecutionNodeState,
    pub received_inputs: HashMap<String, serde_json::Value>,
}

impl NodeExecutionContext {
    pub fn new() -> Self {
        Self {
            state: ExecutionNodeState::Pending,
            received_inputs: HashMap::new(),
        }
    }
}

#[derive(Debug)]
pub struct ExecutionContext {
    pub execution_id: String,
    pub workflow: Workflow,
    pub dag: ResolvedDag,
    pub state: ExecutionState,
    pub nodes: DashMap<String, NodeExecutionContext>,
}

impl ExecutionContext {
    pub fn new(execution_id: String, workflow: Workflow, dag: ResolvedDag) -> Arc<Self> {
        let nodes = DashMap::new();
        for node in &workflow.nodes {
            nodes.insert(node.id.clone(), NodeExecutionContext::new());
        }
        Arc::new(Self {
            execution_id,
            workflow,
            dag,
            state: ExecutionState::Queued,
            nodes,
        })
    }

    pub fn root_nodes(&self) -> Vec<String> {
        let has_incoming_trigger: std::collections::HashSet<String> = self.workflow.edges.iter()
            .filter(|e| e.kind == lamina_core::workflow::EdgeKind::Trigger)
            .map(|e| e.to.node_id.clone())
            .collect();

        self.workflow.nodes.iter()
            .filter(|n| !has_incoming_trigger.contains(&n.id))
            .map(|n| n.id.clone())
            .collect()
    }

    pub fn set_node_state(&self, node_id: &str, state: ExecutionNodeState) {
        if let Some(mut ctx) = self.nodes.get_mut(node_id) {
            ctx.state = state;
        }
    }

    pub fn deliver_input(&self, node_id: &str, port: &str, data: serde_json::Value) {
        if let Some(mut ctx) = self.nodes.get_mut(node_id) {
            ctx.state = ExecutionNodeState::Receiving;
            ctx.received_inputs.insert(port.to_string(), data);
        }
    }

    pub fn get_inputs(&self, node_id: &str) -> HashMap<String, serde_json::Value> {
        self.nodes
            .get(node_id)
            .map(|ctx| ctx.received_inputs.clone())
            .unwrap_or_default()
    }
}