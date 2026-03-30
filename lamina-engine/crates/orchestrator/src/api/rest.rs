use axum::{
    Router,
    routing::{get, post, delete},
    extract::{Path, State},
    response::{sse::{Event, Sse}, IntoResponse},
    http::StatusCode,
    Json,
};
use std::sync::Arc;
use std::convert::Infallible;
use dashmap::DashMap;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;
use futures_util::stream;
use uuid::Uuid;

use lamina_core::messages::ExecuteWorkflowMsg;
use lamina_core::state::ExecutionState;

use crate::execution::ExecutionContext;
use crate::nats::NatsClient;
use crate::orchestrator::Orchestrator;

#[derive(Clone)]
pub struct AppState {
    pub orchestrator: Arc<Orchestrator>,
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/executions", post(submit_execution))
        .route("/executions/:id", get(get_execution))
        .route("/executions/:id", delete(cancel_execution))
        .route("/executions/:id/nodes/:node_id", get(get_node_status))
        .route("/executions/:id/logs", get(get_logs))
        .route("/executions/:id/stream", get(stream_execution))
        .with_state(state)
}

async fn health() -> impl IntoResponse {
    StatusCode::OK
}

#[derive(serde::Deserialize)]
pub struct SubmitRequest {
    pub execution_id: Option<String>,
    pub workflow: lamina_core::workflow::Workflow,
    pub inputs: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(serde::Serialize)]
pub struct SubmitResponse {
    pub execution_id: String,
}

async fn submit_execution(
    State(state): State<AppState>,
    Json(req): Json<SubmitRequest>,
) -> impl IntoResponse {
    let execution_id = req.execution_id
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    state.orchestrator.pre_register(&execution_id);

    let msg = ExecuteWorkflowMsg {
        execution_id: execution_id.clone(),
        workflow: req.workflow,
        inputs: req.inputs,
    };

    match state.orchestrator.enqueue(msg).await {
        Ok(_) => (
            StatusCode::ACCEPTED,
            Json(SubmitResponse { execution_id }),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            e.to_string(),
        ).into_response(),
    }
}

async fn get_execution(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.orchestrator.get_execution_status(&id) {
        Some(status) => Json(status).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn get_node_status(
    State(state): State<AppState>,
    Path((id, node_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match state.orchestrator.get_node_status(&id, &node_id) {
        Some(status) => Json(status).into_response(),
        None => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn cancel_execution(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.orchestrator.cancel_execution(&id).await {
        Ok(_) => StatusCode::OK.into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn get_logs(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    match state.orchestrator.get_logs(&id).await {
        Ok(logs) => Json(logs).into_response(),
        Err(_) => StatusCode::NOT_FOUND.into_response(),
    }
}

async fn stream_execution(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let receiver = state.orchestrator.subscribe_execution_stream(&id);

    match receiver {
        Some(rx) => {
            let stream = BroadcastStream::new(rx)
                .filter_map(|result| {
                    result.ok().map(|data| {
                        Ok::<Event, Infallible>(
                            Event::default().data(data)
                        )
                    })
                });
            Sse::new(stream).into_response()
        }
        None => StatusCode::NOT_FOUND.into_response(),
    }
}