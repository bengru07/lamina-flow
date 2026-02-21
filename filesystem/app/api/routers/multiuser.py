from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json

router = APIRouter()

class CollaborationManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, path: str, user_id: str):
        await websocket.accept()
        if path not in self.rooms:
            self.rooms[path] = {}
        self.rooms[path][user_id] = websocket

    def disconnect(self, path: str, user_id: str):
        if path in self.rooms:
            self.rooms[path].pop(user_id, None)
            if not self.rooms[path]:
                del self.rooms[path]

    async def broadcast(self, path: str, sender_id: str, message: dict):
        if path in self.rooms:
            for user_id, websocket in self.rooms[path].items():
                if user_id != sender_id:
                    try:
                        await websocket.send_json(message)
                    except:
                        pass

manager = CollaborationManager()

@router.websocket("/ws/workflow/{path:path}")
async def websocket_endpoint(websocket: WebSocket, path: str, user_id: str):
    await manager.connect(websocket, path, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await manager.broadcast(path, user_id, message)
    except WebSocketDisconnect:
        manager.disconnect(path, user_id)
        await manager.broadcast(path, user_id, {"type": "cursor_leave", "userId": user_id})