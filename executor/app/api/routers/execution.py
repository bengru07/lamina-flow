from fastapi import APIRouter, HTTPException
from typing import List
from app.api.dtos.execution import DeploymentRequest
from app.services import service_execution as execution_service

router = APIRouter(prefix="/execution", tags=["execution"])

@router.post("/deploy")
def deploy_workflows(payload: List[DeploymentRequest]):
    deployment_ids = execution_service.deploy(payload)
    return {"status": "deployed", "ids": deployment_ids}

@router.get("/deployments")
def list_deployments():
    return execution_service.get_active_deployments()

@router.get("/deployments/{deployment_id}")
def get_deployment(deployment_id: str):
    deployment = execution_service.get_deployment_by_id(deployment_id)
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@router.post("/deployments/{deployment_id}/activate")
def activate_workflow(deployment_id: str):
    try:
        results = execution_service.activate_deployment(deployment_id)
        return {"status": "activated", "results": results}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/deployments/{deployment_id}/deactivate")
async def deactivate_workflow(deployment_id: str):
    try:
        result = await execution_service.stop_deployment(deployment_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/deployments")
def clear_all_deployments():
    execution_service.clear_deployments()
    return {"status": "memory cleared"}
