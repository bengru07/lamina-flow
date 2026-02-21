from fastapi import APIRouter, HTTPException
from app.api.dtos.workspace import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
    WorkflowSaveRequest,
    PathRequest,
    RenameRequest,
    MoveRequest
)
from app.services import service_workspace as workspace_service

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.post("")
def create_workspace(payload: WorkspaceCreateRequest):
    return workspace_service.create_workspace(payload.name, payload.description)


@router.get("")
def list_workspaces():
    return workspace_service.list_workspaces()


@router.get("/{workspace_id}")
def get_workspace(workspace_id: str):
    try:
        return workspace_service.get_workspace(workspace_id)
    except FileNotFoundError:
        raise HTTPException(404)


@router.put("/{workspace_id}")
def update_workspace(workspace_id: str, payload: WorkspaceUpdateRequest):
    try:
        return workspace_service.update_workspace(workspace_id, payload.dict())
    except FileNotFoundError:
        raise HTTPException(404)


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str):
    try:
        workspace_service.delete_workspace(workspace_id)
        return {"status": "deleted"}
    except FileNotFoundError:
        raise HTTPException(404)


@router.get("/{workspace_id}/project")
def list_project(workspace_id: str):
    return workspace_service.list_project_tree(workspace_id)


@router.post("/{workspace_id}/workflow/{path:path}")
def save_workflow(workspace_id: str, path: str, payload: WorkflowSaveRequest):
    workspace_service.save_workflow(workspace_id, path, payload.data)
    return {"status": "saved"}


@router.get("/{workspace_id}/workflow/{path:path}")
def load_workflow(workspace_id: str, path: str):
    try:
        return workspace_service.load_workflow(workspace_id, path)
    except FileNotFoundError:
        raise HTTPException(404)


@router.delete("/{workspace_id}/path")
def delete_path(workspace_id: str, payload: PathRequest):
    try:
        workspace_service.delete_path(workspace_id, payload.path)
        return {"status": "deleted"}
    except FileNotFoundError:
        raise HTTPException(404)


@router.post("/{workspace_id}/rename")
def rename_path(workspace_id: str, payload: RenameRequest):
    workspace_service.rename_path(workspace_id, payload.path, payload.new_name)
    return {"status": "renamed"}


@router.post("/{workspace_id}/move")
def move_path(workspace_id: str, payload: MoveRequest):
    workspace_service.move_path(workspace_id, payload.source_path, payload.target_path)
    return {"status": "moved"}
