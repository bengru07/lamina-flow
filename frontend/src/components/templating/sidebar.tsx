import React from "react"
import { Plus, Trash2, X, Save, FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { NodeTemplate, Parameter } from "@/components/templating/types"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { saveTemplateToLibrary, addTemplateToWorkspace } from "@/redux/templates/TemplateThunk"
import { toast } from "sonner"

interface SidebarConfigProps {
  template: NodeTemplate;
  updateRootField: (field: keyof NodeTemplate, value: any) => void;
  updateParameter: (id: string, updates: Partial<Parameter>) => void;
  addParameter: () => void;
  removeParameter: (id: string) => void;
  addOutput: () => void;
  removeOutput: (id: string) => void;
  updateOutput: (id: string, updates: any) => void;
}

export function SidebarConfig({
  template,
  updateRootField,
  updateParameter,
  addParameter,
  removeParameter,
  addOutput,
  removeOutput,
  updateOutput
}: SidebarConfigProps) {
  if (!template || !template.schema) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-zinc-500 italic">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Initializing template...
      </div>
    )
  }
  
  const dispatch = useAppDispatch()
  const activeWorkspace = useAppSelector((state) => state.workspaces.active)
  const saveStatus = useAppSelector((state) => state.templates.requests.saveToLibrary)
  const addStatus = useAppSelector((state) => state.templates.requests.addToWorkspace)

  const [newEnumValue, setNewEnumValue] = React.useState<Record<string, string>>({})

  const translateToSafeType = (val: string) => {
    return val
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9\-_]/g, '_')
      .replace(/__+/g, '_')
  }

  const handleAddEnum = (paramId: string) => {
    const val = newEnumValue[paramId]?.trim()
    const param = template.schema.parameters.find(p => p.id === paramId)
    if (val && param && !param.values?.includes(val)) {
      updateParameter(paramId, { values: [...(param.values || []), val] })
      setNewEnumValue(prev => ({ ...prev, [paramId]: "" }))
    }
  }

  const handleSaveToLibrary = async () => {
    if (!template.type) return toast.error("Please provide a unique node type")
    dispatch(saveTemplateToLibrary({ 
      name: template.type, 
      payload: template 
    })).then(() => toast.success("Template saved to global library"))
  }

  const handleAddToProject = async () => {
    if (!activeWorkspace) return toast.error("No active project found")
    if (!template.type) return toast.error("Please provide a unique node type")
    
    dispatch(addTemplateToWorkspace({
      workspaceId: activeWorkspace.uuid,
      templateName: template.type
    })).then(() => toast.success(`Added ${template.type} to project`))
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-400">
      <div className="px-6 py-8 space-y-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Node Configuration</h3>
            <div className="h-[1px] w-full bg-zinc-800/50" />
          </div>

          <div className="flex gap-2 pb-2">
            <Button 
              size="sm" 
              className="flex-1 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 h-8 text-[11px] font-bold"
              onClick={handleSaveToLibrary}
              disabled={saveStatus === "pending"}
            >
              {saveStatus === "pending" ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
              Save Library
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1 border-zinc-800 bg-transparent hover:bg-zinc-900 h-8 text-[11px] font-bold"
              onClick={handleAddToProject}
              disabled={addStatus === "pending" || !activeWorkspace}
            >
              {addStatus === "pending" ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <FolderPlus className="w-3 h-3 mr-2" />}
              To Project
            </Button>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex w-full gap-4">
              <div className="grid gap-2 flex-1">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Label</Label>
                <Input 
                  className="h-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700" 
                  value={template.label} 
                  onChange={(e) => updateRootField("label", e.target.value)} 
                />
              </div>
              <div className="grid gap-2 flex-1">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Type ID</Label>
                <Input 
                  className="h-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700 font-mono text-xs" 
                  value={template.type} 
                  onChange={(e) => updateRootField("type", translateToSafeType(e.target.value))} 
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Category</Label>
              <Input 
                className="h-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700" 
                value={template.category} 
                onChange={(e) => updateRootField("category", e.target.value)} 
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Description</Label>
              <Textarea 
                className="min-h-[60px] bg-zinc-900/50 border-zinc-800 text-zinc-200 resize-none focus-visible:ring-1 focus-visible:ring-zinc-700" 
                value={template.description} 
                onChange={(e) => updateRootField("description", e.target.value)} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Inputs</h3>
            <Button onClick={addParameter} variant="outline" className="h-7 text-[10px] bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {template.schema.parameters.map((param) => (
              <Card key={param.id} className="bg-[#111111] border-zinc-800/60 p-4 space-y-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <Input 
                    className="h-6 p-2 border-none bg-transparent text-sm font-medium text-zinc-100 focus-visible:ring-0" 
                    value={param.label} 
                    onChange={(e) => updateParameter(param.id, { label: e.target.value })}
                  />
                  <Button onClick={() => removeParameter(param.id)} variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-zinc-500">Slug ID</span>
                    <Input 
                      className="h-6 w-[120px] bg-zinc-900 border-zinc-800 text-[10px] font-mono"
                      value={param.id}
                      onChange={(e) => updateParameter(param.id, { id: translateToSafeType(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Data Type</span>
                    <Select value={param.type} onValueChange={(v: any) => updateParameter(param.id, { type: v })}>
                      <SelectTrigger className="h-7 w-[100px] text-[11px] bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                        <SelectItem value="enum">Enum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500">Allow Connection</span>
                    <Switch checked={param.canConnect} onCheckedChange={(v) => updateParameter(param.id, { canConnect: v })} className="scale-75" />
                  </div>
                </div>
                {param.type === "enum" && (
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {param.values?.map((v) => (
                        <Badge key={v} className="bg-zinc-800 text-zinc-300 border-none rounded px-2 py-0.5 text-[10px] flex items-center gap-1.5" onClick={() => updateParameter(param.id, { values: param.values?.filter(x => x !== v) })}>
                          {v} <X className="w-2.5 h-2.5 cursor-pointer" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        className="h-8 bg-zinc-950 border-zinc-800 text-xs" 
                        value={newEnumValue[param.id] || ""} 
                        onChange={(e) => setNewEnumValue(prev => ({ ...prev, [param.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEnum(param.id)}
                      />
                      <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 border-zinc-800" onClick={() => handleAddEnum(param.id)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Outputs</h3>
            <Button onClick={addOutput} variant="outline" className="h-7 text-[10px] bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {template.schema.outputs.map((output) => (
              <Card key={output.id} className="bg-[#111111] border-zinc-800/60 p-3 space-y-3 shadow-none">
                <div className="flex items-center justify-between gap-2">
                  <Input 
                    className="h-6 p-2 border-none bg-transparent text-sm font-medium text-zinc-100 focus-visible:ring-0" 
                    value={output.label} 
                    onChange={(e) => updateOutput(output.id, { label: e.target.value })} 
                  />
                  <Button onClick={() => removeOutput(output.id)} variant="ghost" size="icon" className="h-5 w-5 text-zinc-600 hover:text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-zinc-600 font-bold ml-1">Slug ID</Label>
                    <Input 
                      className="h-7 bg-zinc-900 border-zinc-800 text-[10px] font-mono"
                      value={output.id}
                      onChange={(e) => updateOutput(output.id, { id: translateToSafeType(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-zinc-600 font-bold ml-1">Type</Label>
                    <Input 
                      className="h-7 bg-zinc-900 border-zinc-800 text-[10px]"
                      value={output.type}
                      onChange={(e) => updateOutput(output.id, { type: e.target.value })}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}