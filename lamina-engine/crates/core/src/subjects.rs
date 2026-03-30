pub fn workflow_execute(workflow_id: &str) -> String {
    format!("lamina.workflow.{}.execute", workflow_id)
}

pub fn workflow_state(workflow_id: &str) -> String {
    format!("lamina.workflow.{}.state", workflow_id)
}

pub fn node_trigger(node_id: &str) -> String {
    format!("lamina.node.{}.trigger", node_id)
}

pub fn triggers_queue() -> String {
    "lamina.triggers".to_string()
}
pub fn node_emit(node_id: &str, port: &str) -> String {
    format!("lamina.node.{}.emit.{}", node_id, port)
}

pub fn node_state(node_id: &str) -> String {
    format!("lamina.node.{}.state", node_id)
}

pub fn execution_log(execution_id: &str) -> String {
    format!("lamina.execution.{}.log", execution_id)
}

pub fn execution_done(execution_id: &str) -> String {
    format!("lamina.execution.{}.done", execution_id)
}