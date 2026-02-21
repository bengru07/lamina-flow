from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services import service_node_templates as template_service

router = APIRouter(prefix="/node-templates", tags=["node-templates"])

@router.post("")
def save_template(name: str, payload: Dict[str, Any]):
    return template_service.save_template_to_library(name, payload)

@router.get("")
def list_templates():
    return template_service.list_library_templates()

@router.post("/{workspace_id}/add")
def add_template_to_workspace(workspace_id: str, template_name: str):
    try:
        return template_service.add_template_to_workspace(workspace_id, template_name)
    except FileNotFoundError:
        raise HTTPException(404, detail="Workspace or Template not found")

@router.delete("/{name}")
def delete_template(name: str):
    template_service.delete_template_from_library(name)
    return {"status": "deleted"}