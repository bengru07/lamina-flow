from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services import service_ai as ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatRequest(BaseModel):
    prompt: str
    provider_id: str
    workspace_ids: List[str] = []

@router.post("/chat")
async def chat_with_context(payload: ChatRequest):
    try:
        response = await ai_service.process_ai_query(
            payload.prompt,
            payload.provider_id,
            payload.workspace_ids
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))