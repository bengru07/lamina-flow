from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

class Connection(BaseModel):
    targetNode: "WorkflowTreeNode"
    targetHandle: str

class WorkflowTreeNode(BaseModel):
    id: str
    type: str = "generic"
    data: Dict[str, Any] = Field(default_factory=dict)
    connections: Dict[str, List[Connection]] = Field(default_factory=dict)

WorkflowTreeNode.model_rebuild()

@dataclass
class WorkflowParameter:
    id: str
    label: str
    type: str
    value: Any
    canConnect: bool

@dataclass
class WorkflowOutput:
    id: str
    label: str
    type: str

@dataclass
class WorkflowSchema:
    label: str
    category: str
    parameters: List[WorkflowParameter]
    outputs: List[WorkflowOutput]

@dataclass
class WorkflowNodeData:
    schema: WorkflowSchema
    values: Dict[str, Any]
    connectedParams: Dict[str, Any]

@dataclass
class ConnectionData:
    targetNode: "WorkflowTreeNodeDataClass"
    targetHandle: str

@dataclass
class WorkflowTreeNodeDataClass:
    id: str
    type: str
    data: WorkflowNodeData
    connections: Dict[str, List[ConnectionData]]

@dataclass
class NodeTemplate:
    label: str
    category: str
    type: str
    icon: str
    schema: WorkflowSchema

@dataclass
class WorkspaceBuilder:
    nodes_dir: str
    node_templates: List[NodeTemplate]

@dataclass
class Workspace:
    uuid: str
    name: str
    description: str
    shorthand: str
    settings: Dict[str, Any]
    builder: WorkspaceBuilder

@dataclass
class DeploymentMetadata:
    name: str
    workspace: Workspace
    timestamp: str
    status: Optional[str] = "idle"

@dataclass
class Deployment:
    forest: List[WorkflowTreeNodeDataClass]
    metadata: DeploymentMetadata
    reference_id: str

    def __init__(self, forest, metadata, reference_id):
        self.forest = forest
        self.metadata = metadata
        self.reference_id = reference_id

    def __str__(self):
        return f"Deployment(id={self.reference_id}, forest_size={len(self.forest)})"



class DeploymentRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    forest: List[WorkflowTreeNodeDataClass]
    metadata: Optional[DeploymentMetadata] = None