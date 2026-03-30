use std::sync::Arc;
use anyhow::Result;
use dashmap::DashMap;
use tokio::sync::broadcast;
use tracing::{info, error};
use futures_util::StreamExt;

use lamina_core::dag;
use lamina_core::messages::{
    ExecuteWorkflowMsg, TriggerNodeMsg, NodeEmitMsg,
    ExecutionStateMsg, ExecutionStatus, NodeExecutionStatus,
};
use lamina_core::state::{ExecutionState, ExecutionNodeState, NodeLifecycle};

use crate::execution::ExecutionContext;
use crate::nats::NatsClient;

const BROADCAST_CAPACITY: usize = 256;

pub struct Orchestrator {
    pub nats: NatsClient,
    pub executions: Arc<DashMap<String, Arc<ExecutionContext>>>,
    pub streams: Arc<DashMap<String, broadcast::Sender<String>>>,
}

impl Orchestrator {
    pub fn new(nats: NatsClient) -> Self {
        Self {
            nats,
            executions: Arc::new(DashMap::new()),
            streams: Arc::new(DashMap::new()),
        }
    }

    pub async fn enqueue(&self, msg: ExecuteWorkflowMsg) -> Result<()> {
        let payload = serde_json::to_vec(&msg)?;
        let subject = lamina_core::subjects::workflow_execute(&msg.workflow.id);
        self.nats.client().publish(subject, payload.into()).await?;
        Ok(())
    }

    pub fn get_execution_status(&self, execution_id: &str) -> Option<ExecutionStatus> {
        self.executions.get(execution_id).map(|ctx| {
            let nodes = ctx.nodes.iter().map(|entry| NodeExecutionStatus {
                node_id: entry.key().clone(),
                lifecycle: NodeLifecycle::Ready,
                execution_state: entry.value().state.clone(),
            }).collect();
            ExecutionStatus {
                execution_id: execution_id.to_string(),
                state: ctx.state.clone(),
                nodes,
            }
        })
    }

    pub fn get_node_status(&self, execution_id: &str, node_id: &str) -> Option<NodeExecutionStatus> {
        self.executions.get(execution_id).and_then(|ctx| {
            ctx.nodes.get(node_id).map(|entry| NodeExecutionStatus {
                node_id: node_id.to_string(),
                lifecycle: NodeLifecycle::Ready,
                execution_state: entry.value().state.clone(),
            })
        })
    }

    pub async fn cancel_execution(&self, execution_id: &str) -> Result<()> {
        if self.executions.contains_key(execution_id) {
            self.publish_execution_state(execution_id, ExecutionState::Cancelled, None).await?;
            self.executions.remove(execution_id);
            self.streams.remove(execution_id);
            Ok(())
        } else {
            anyhow::bail!("execution not found: {}", execution_id)
        }
    }

    pub async fn get_logs(&self, _execution_id: &str) -> Result<Vec<serde_json::Value>> {
        Ok(vec![])
    }

    pub fn subscribe_execution_stream(&self, execution_id: &str) -> Option<broadcast::Receiver<String>> {
        self.streams.get(execution_id).map(|tx| tx.subscribe())
    }

    pub async fn start(self: Arc<Self>) -> Result<()> {
        info!("orchestrator starting");
        self.nats.setup_triggers_stream().await?;
        let mut sub = self.nats.subscribe_workflow_execute().await?;

        while let Some(msg) = sub.next().await {
            if !msg.subject.ends_with(".execute") {
                continue;
            }
            let this = Arc::clone(&self);
            tokio::spawn(async move {
                match serde_json::from_slice::<ExecuteWorkflowMsg>(&msg.payload) {
                    Ok(execute_msg) => {
                        if let Err(e) = this.handle_execute(execute_msg).await {
                            error!("execution error: {}", e);
                        }
                    }
                    Err(e) => error!("failed to deserialize execute message: {}", e),
                }
            });
        }

        Ok(())
    }

    async fn handle_execute(self: &Arc<Self>, msg: ExecuteWorkflowMsg) -> Result<()> {
        let execution_id = msg.execution_id.clone();
        info!("starting execution {}", execution_id);

        let dag = match dag::resolve(&msg.workflow) {
            Ok(d) => d,
            Err(e) => {
                self.publish_execution_state(&execution_id, ExecutionState::Failed, Some(e.to_string())).await?;
                return Ok(());
            }
        };

        self.streams.entry(execution_id.clone()).or_insert_with(|| {
            let (tx, _) = broadcast::channel(BROADCAST_CAPACITY);
            tx
        });

        let ctx = ExecutionContext::new(execution_id.clone(), msg.workflow, dag);
        self.executions.insert(execution_id.clone(), Arc::clone(&ctx));
        self.publish_execution_state(&execution_id, ExecutionState::Running, None).await?;

        // deliver workflow inputs to root nodes
        for (port, value) in msg.inputs {
            for root_id in ctx.root_nodes() {
                if ctx.workflow.nodes.iter()
                    .find(|n| n.id == root_id)
                    .map(|n| n.manifest.inputs.contains(&port))
                    .unwrap_or(false)
                {
                    ctx.deliver_input(&root_id, &port, value.clone());
                }
            }
        }

        // pre-build emit subscribers before triggering anything
        let mut subscribers: Vec<(String, async_nats::Subscriber)> = vec![];
        for node in &ctx.workflow.nodes {
            let sub = self.nats.subscribe_emit(&node.id).await?;
            subscribers.push((node.id.clone(), sub));
        }

        let this = Arc::clone(self);
        let ctx_clone = Arc::clone(&ctx);
        tokio::spawn(async move {
            if let Err(e) = this.process_emissions(ctx_clone, subscribers).await {
                error!("emission listener error: {}", e);
            }
        });

        // only trigger nodes that have no incoming trigger edges — they are the entry points
        let has_incoming_trigger: std::collections::HashSet<String> = ctx.workflow.edges.iter()
            .filter(|e| e.kind == lamina_core::workflow::EdgeKind::Trigger)
            .map(|e| e.to.node_id.clone())
            .collect();

        let entry_nodes: Vec<String> = ctx.workflow.nodes.iter()
            .filter(|n| !has_incoming_trigger.contains(&n.id))
            .map(|n| n.id.clone())
            .collect();

        for node_id in entry_nodes {
            self.trigger_node(&ctx, &node_id).await?;
        }

        Ok(())
    }
    
    async fn trigger_node(&self, ctx: &Arc<ExecutionContext>, node_id: &str) -> Result<()> {
        let inputs = ctx.get_inputs(node_id);
        ctx.set_node_state(node_id, ExecutionNodeState::Triggered);
        self.broadcast_node_state(ctx, node_id, ExecutionNodeState::Triggered);

        let manifest = ctx.workflow.nodes
            .iter()
            .find(|n| n.id == node_id)
            .map(|n| n.manifest.clone());

        let msg = TriggerNodeMsg {
            execution_id: ctx.execution_id.clone(),
            node_id: node_id.to_string(),
            inputs,
            manifest,
        };

        self.nats.client().publish(
            lamina_core::subjects::triggers_queue(),
            serde_json::to_vec(&msg)?.into()
        ).await?;
        info!("triggered node {} in execution {}", node_id, ctx.execution_id);
        Ok(())
    }

    pub fn pre_register(&self, execution_id: &str) {
        let (tx, _) = broadcast::channel(BROADCAST_CAPACITY);
        self.streams.insert(execution_id.to_string(), tx);
    }

    async fn process_emissions(
        self: Arc<Self>,
        ctx: Arc<ExecutionContext>,
        subscribers: Vec<(String, async_nats::Subscriber)>,
    ) -> Result<()> {
        let mut handles = vec![];

        for (node_id, mut sub) in subscribers {
            let this = Arc::clone(&self);
            let ctx = Arc::clone(&ctx);

            let handle = tokio::spawn(async move {
                while let Some(msg) = sub.next().await {
                    let port = msg.subject
                        .split('.')
                        .last()
                        .unwrap_or("")
                        .to_string();

                    match serde_json::from_slice::<NodeEmitMsg>(&msg.payload) {
                        Ok(emit_msg) => {
                            if emit_msg.execution_id != ctx.execution_id {
                                continue;
                            }
                            if let Err(e) = this.handle_emission(&ctx, &emit_msg, &port).await {
                                error!("emission handling error: {}", e);
                            }
                        }
                        Err(e) => error!("failed to deserialize emit message: {}", e),
                    }
                }
            });

            handles.push(handle);
        }

        for handle in handles {
            handle.await?;
        }

        Ok(())
    }

    async fn handle_emission(
        &self,
        ctx: &Arc<ExecutionContext>,
        msg: &NodeEmitMsg,
        port: &str,
    ) -> Result<()> {
        ctx.set_node_state(&msg.node_id, ExecutionNodeState::Done);
        self.broadcast_node_state(ctx, &msg.node_id, ExecutionNodeState::Done);

        let forward = ctx.dag.routes.get(&msg.node_id);
        let feedback = ctx.dag.feedback_routes.get(&msg.node_id);

        let mut data_targets: Vec<(String, String)> = vec![];

        for routes in forward.iter().chain(feedback.iter()) {
            for route in routes.iter() {
                if route.from_port == port {
                    data_targets.push((route.to_node.clone(), route.to_port.clone()));
                }
            }
        }

        for (to_node, to_port) in data_targets {
            ctx.deliver_input(&to_node, &to_port, msg.data.clone());
        }

        let trigger_targets = ctx.dag.trigger_routes
            .get(&msg.node_id)
            .cloned()
            .unwrap_or_default();

        for target_node in trigger_targets {
            self.trigger_node(ctx, &target_node).await?;
        }

        self.check_completion(ctx).await?;
        Ok(())
    }

    async fn check_completion(&self, ctx: &Arc<ExecutionContext>) -> Result<()> {
        let all_done = ctx.nodes.iter().all(|entry| {
            matches!(
                entry.value().state,
                ExecutionNodeState::Done
                    | ExecutionNodeState::Skipped
                    | ExecutionNodeState::Failed
            )
        });

        if all_done {
            self.publish_execution_state(&ctx.execution_id, ExecutionState::Completed, None).await?;

            if let Some(tx) = self.streams.get(&ctx.execution_id) {
                let event = serde_json::json!({
                    "type": "execution_done",
                    "execution_id": ctx.execution_id,
                    "state": "completed",
                });
                let _ = tx.send(event.to_string());
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

            self.executions.remove(&ctx.execution_id);
            self.streams.remove(&ctx.execution_id);
            info!("execution {} completed", ctx.execution_id);
        }

        Ok(())
    }

    fn broadcast_node_state(
        &self,
        ctx: &Arc<ExecutionContext>,
        node_id: &str,
        state: ExecutionNodeState,
    ) {
        if let Some(tx) = self.streams.get(&ctx.execution_id) {
            let event = serde_json::json!({
                "type": "node_state",
                "node_id": node_id,
                "state": state,
            });
            let _ = tx.send(event.to_string());
        }
    }

    async fn publish_execution_state(
        &self,
        execution_id: &str,
        state: ExecutionState,
        error: Option<String>,
    ) -> Result<()> {
        let msg = ExecutionStateMsg {
            execution_id: execution_id.to_string(),
            state,
            error,
        };
        self.nats.publish_execution_state(&msg).await?;
        Ok(())
    }
}