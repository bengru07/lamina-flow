export interface Parameter {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum";
  value: any;
  canConnect: boolean;
  values?: string[];
}

export interface NodeOutput {
  id: string;
  label: string;
  type: string;
}

export interface NodeSchema {
  label: string;
  category: string;
  parameters: Parameter[];
  outputs: NodeOutput[];
}

export interface NodeTemplate {
  label: string;
  category: string;
  type: string;
  description?: string;
  schema: NodeSchema;
}