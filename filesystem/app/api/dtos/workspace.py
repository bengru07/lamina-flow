from pydantic import BaseModel
from typing import Optional, List, Any


class WorkspaceCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkspaceResponse(BaseModel):
    uuid: str
    name: str
    description: Optional[str]


class WorkflowPayload(BaseModel):
    nodes: List[Any]
    edges: List[Any]


class WorkflowSaveRequest(BaseModel):
    data: Any


class PathRequest(BaseModel):
    path: str


class RenameRequest(BaseModel):
    path: str
    new_name: str


class MoveRequest(BaseModel):
    source_path: str
    target_path: str
