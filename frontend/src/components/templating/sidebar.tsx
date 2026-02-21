import React from "react"
import { Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { NodeSchema, Parameter } from "@/components/templating/types"

interface SidebarConfigProps {
  schema: NodeSchema;
  updateSchema: (field: string, value: any) => void;
  updateParameter: (id: string, updates: Partial<Parameter>) => void;
  addParameter: () => void;
  removeParameter: (id: string) => void;
  addOutput: () => void;
  removeOutput: (id: string) => void;
  updateOutput: (id: string, updates: any) => void;
}

export function SidebarConfig({
  schema,
  updateSchema,
  updateParameter,
  addParameter,
  removeParameter,
  addOutput,
  removeOutput,
  updateOutput
}: SidebarConfigProps) {
  const [newEnumValue, setNewEnumValue] = React.useState<Record<string, string>>({})

  const handleAddEnum = (paramId: string) => {
    const val = newEnumValue[paramId]?.trim()
    const param = schema.parameters.find(p => p.id === paramId)
    if (val && param && !param.values?.includes(val)) {
      updateParameter(paramId, { values: [...(param.values || []), val] })
      setNewEnumValue(prev => ({ ...prev, [paramId]: "" }))
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-400">
      <div className="px-6 py-8 space-y-10">
        
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Node Configuration</h3>
            <div className="h-[1px] w-full bg-zinc-800/50" />
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex w-full gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Label</Label>
                <Input 
                  className="max-w-200 h-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700" 
                  value={schema.label} 
                  onChange={(e) => updateSchema("label", e.target.value)} 
                  placeholder="Node display name"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Type (unique)</Label>
                <Input 
                  className="max-w-200 h-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-700" 
                  value={schema.type} 
                  onChange={(e) => updateSchema("type", e.target.value)} 
                  placeholder="Node type"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] uppercase text-zinc-500 font-bold ml-1">Description</Label>
              <Textarea 
                className="min-h-[60px] bg-zinc-900/50 border-zinc-800 text-zinc-200 resize-none focus-visible:ring-1 focus-visible:ring-zinc-700" 
                value={schema.description} 
                onChange={(e) => updateSchema("description", e.target.value)} 
                placeholder="What does this node do?"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Inputs</h3>
            <Button 
              onClick={addParameter} 
              variant="outline" 
              className="h-7 text-[10px] bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            >
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {schema.parameters.map((param) => (
              <Card key={param.id} className="bg-[#111111] border-zinc-800/60 rounded-lg p-4 space-y-4 relative group shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <Input 
                    className="h-6 p-2 border-none bg-transparent text-sm font-medium text-zinc-100 focus-visible:ring-0 placeholder:text-zinc-600" 
                    value={param.label} 
                    onChange={(e) => updateParameter(param.id, { label: e.target.value })}
                    placeholder="Input Label"
                  />
                  <Button 
                    onClick={() => removeParameter(param.id)} 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-zinc-600 hover:text-zinc-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-3">
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
                    <Switch 
                      checked={param.canConnect} 
                      onCheckedChange={(v) => updateParameter(param.id, { canConnect: v })} 
                      className="scale-75 data-[state=checked]:bg-zinc-200"
                    />
                  </div>
                </div>

                {param.type === "enum" && (
                  <div className="pt-3 border-t border-zinc-800 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {param.values?.map((v) => (
                        <Badge 
                          key={v} 
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-none rounded px-2 py-0.5 text-[10px] flex items-center gap-1.5"
                          onClick={() => updateParameter(param.id, { values: param.values?.filter(x => x !== v) })}
                        >
                          {v}
                          <X 
                            className="w-2.5 h-2.5 cursor-pointer text-zinc-500" 
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        className="h-8 bg-zinc-950 border-zinc-800 text-xs text-zinc-300" 
                        placeholder="Add option..."
                        value={newEnumValue[param.id] || ""} 
                        onChange={(e) => setNewEnumValue(prev => ({ ...prev, [param.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEnum(param.id)}
                      />
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="h-8 w-8 shrink-0 border-zinc-800 hover:bg-zinc-900" 
                        onClick={() => handleAddEnum(param.id)}
                      >
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
            <Button 
              onClick={addOutput} 
              variant="outline" 
              className="h-7 text-[10px] bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
            >
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          
          <div className="space-y-2">
            {schema.outputs.map((output) => (
              <div key={output.id} className="flex items-center gap-2 group p-1 pr-2 rounded-md hover:bg-zinc-900/50 transition-colors">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 ml-2" />
                <Input 
                  className="h-7 border-none bg-transparent text-xs text-zinc-300 focus-visible:ring-0 placeholder:text-zinc-700" 
                  value={output.label} 
                  onChange={(e) => updateOutput(output.id, { label: e.target.value })} 
                  placeholder="Output label..."
                />
                <Button 
                  onClick={() => removeOutput(output.id)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-200 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}