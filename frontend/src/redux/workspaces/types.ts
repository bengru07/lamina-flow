/** Represents the configuration for a single node parameter. **/
type NodeParameter = {
  id: string;
  label: string;
  type: string;
  value: any;
  canConnect: boolean;
};

/** Represents the data output port of a node. **/
type NodeOutput = {
  id: string;
  label: string;
  type: string;
};

/** The internal schema defining the structure of a node. **/
type NodeSchema = {
  label: string;
  category: string;
  parameters: NodeParameter[];
  outputs: NodeOutput[];
};

/** A template used by the builder to instantiate new nodes. **/
type NodeTemplate = {
  label: string;
  category: string;
  type: string;
  icon: string;
  schema: NodeSchema;
};

/** Configuration for the workspace builder environment. **/
type WorkspaceBuilder = {
  nodes_dir: string;
  node_templates: NodeTemplate[];
};

/** The primary Workspace model updated with builder support. **/
type Workspace = {
  uuid: string;
  name: string;
  description?: string;
  settings: Record<string, any>;
  builder: WorkspaceBuilder;
};