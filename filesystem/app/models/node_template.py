from typing import List, Any


class NodeComponent:
    def __init__(self, id: str, label: str, type: str):
        self.id = id
        self.label = label
        self.type = type

class Parameter(NodeComponent):
    def __init__(self, id: str, label: str, type: str, value: Any = None, can_connect: bool = False):
        super().__init__(id, label, type)
        self.value = value
        self.can_connect = can_connect

class Output(NodeComponent):
    """Data ports that provide information to downstream nodes."""
    pass

class NodeTemplate:
    def __init__(
        self,
        label: str,
        category: str,
        icon: str,
        node_type: str = "generic"
    ):
        self.label = label
        self.category = category
        self.type = node_type
        self.icon = icon
        self.parameters: List[Parameter] = []
        self.outputs: List[Output] = []

    def add_parameter(self, **kwargs):
        self.parameters.append(Parameter(**kwargs))

    def add_output(self, **kwargs):
        self.outputs.append(Output(**kwargs))

    def serialize(self) -> dict:
        return {
            "label": self.label,
            "category": self.category,
            "type": self.type,
            "icon": self.icon,
            "schema": {
                "parameters": [vars(p) for p in self.parameters],
                "outputs": [vars(o) for o in self.outputs]
            }
        }