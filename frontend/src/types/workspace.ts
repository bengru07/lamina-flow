export interface WorkspaceSettings {
  defaultRuntime?: "persistent" | "ephemeral"
  maxInstances?: number
  autoSave?: boolean
}

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  settings?: WorkspaceSettings
  tags: string[]
}