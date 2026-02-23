from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.services import service_settings as settings_service

router = APIRouter(prefix="/settings", tags=["settings"])

class SettingsUpdateRequest(BaseModel):
    settings: Dict[str, Any]

@router.get("")
def get_settings():
    return settings_service.get_all_settings()

@router.put("")
def update_settings(payload: SettingsUpdateRequest):
    return settings_service.update_settings(payload.settings)

@router.get("/schema")
def get_settings_schema():
    return settings_service.get_settings_schema()