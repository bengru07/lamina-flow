export interface Parameter {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "enum";
  value: any;
  canConnect: boolean;
  values?: string[];
}

export interface NodeSchema {
  label: string;
  category: string;
  type: string;
  description: string;
  parameters: Parameter[];
  outputs: { id: string; label: string; type: string }[];
}