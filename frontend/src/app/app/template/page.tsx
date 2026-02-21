"use client"

import React, { useState, useMemo, useCallback } from "react"
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Code2, 
  Save, 
  Layers, 
  X
} from "lucide-react"
import { 
  ReactFlow, 
  Background, 
  ReactFlowProvider, 
  BackgroundVariant 
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable"
import { GenericNode } from "@/components/builder/generic-node"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_SCHEMA = {
  label: "New Node Template",
  category: "General",
  type: "custom_node",
  description: "Description of what this node does.",
  parameters: [
    { id: "input_1", label: "Example Input", type: "string", value: "Default", canConnect: true, values: [] }
  ],
  outputs: [
    { id: "output_1", label: "Result", type: "string" }
  ]
}

export default function NodeTemplateBuilder() {
  const [schema, setSchema] = useState(INITIAL_SCHEMA)
  const [activeTab, setActiveTab] = useState("builder")
  const [newEnumValue, setNewEnumValue] = useState<Record<string, string>>({})

  const nodeTypes = useMemo(() => ({
    custom_node: GenericNode,
    [schema.type]: GenericNode
  }), [schema.type]);

  const nodes = useMemo(() => [
    {
      id: "preview-node",
      type: schema.type,
      position: { x: 0, y: 0 },
      data: {
        schema: { ...schema },
        values: schema.parameters.reduce((acc: any, p) => ({ ...acc, [p.id]: p.value }), {}),
        connectedParams: {},
      },
      selectable: true,
      draggable: true,
    }
  ], [schema])

  const updateSchema = (field: string, value: any) => {
    setSchema(prev => ({ ...prev, [field]: value }))
  }

  const updateParameter = useCallback((id: string, updates: any) => {
    setSchema(prev => ({
      ...prev,
      parameters: prev.parameters.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  }, [])

  const addParameter = () => {
    const id = `param_${Math.random().toString(36).substr(2, 5)}`
    updateSchema("parameters", [...schema.parameters, { 
      id, 
      label: "New Parameter", 
      type: "string", 
      value: "", 
      canConnect: true,
      values: []
    }])
  }

  const removeParameter = (id: string) => {
    updateSchema("parameters", schema.parameters.filter(p => p.id !== id))
  }

  const addEnumValue = (paramId: string) => {
    const val = newEnumValue[paramId]?.trim()
    if (!val) return
    const param = schema.parameters.find(p => p.id === paramId)
    if (param && !param.values?.includes(val)) {
      updateParameter(paramId, { values: [...(param.values || []), val] })
      setNewEnumValue(prev => ({ ...prev, [paramId]: "" }))
    }
  }

  const removeEnumValue = (paramId: string, valueToRemove: string) => {
    const param = schema.parameters.find(p => p.id === paramId)
    if (param) {
      const updatedValues = (param.values || []).filter(v => v !== valueToRemove);
      updateParameter(paramId, { values: updatedValues })
    }
  }

  const addOutput = () => {
    const id = `out_${Math.random().toString(36).substr(2, 5)}`
    updateSchema("outputs", [...schema.outputs, { id, label: "New Output", type: "string" }])
  }

  const removeOutput = (id: string) => {
    updateSchema("outputs", schema.outputs.filter(o => o.id !== id))
  }

  const updateOutput = (id: string, updates: any) => {
    updateSchema("outputs", schema.outputs.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  const renderJsonWithSyntaxHighlighting = (obj: any) => {
    const json = JSON.stringify(obj, null, 2);
    return json.split('\n').map((line, i) => {
      return (
        <div key={i} className="whitespace-pre">
          {line.split(/(".*?")/).map((part, j) => {
            if (part.startsWith('"') && part.endsWith('"')) {
              if (line.includes(`${part}:`)) return <span key={j} className="text-pink-400">{part}</span>;
              return <span key={j} className="text-emerald-300">{part}</span>;
            }
            if (/\d+/.test(part) && !line.includes(`"${part}"`)) return <span key={j} className="text-orange-300">{part}</span>;
            if (/(true|false|null)/.test(part)) return <span key={j} className="text-sky-400 font-bold">{part}</span>;
            return <span key={j} className="text-zinc-400">{part}</span>;
          })}
        </div>
      );
    });
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden relative">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="flex flex-col border-r bg-muted/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-3 pt-3 shrink-0">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="builder" className="gap-2 text-xs">
                  <Layers className="w-3 h-3" /> Template Settings
                </TabsTrigger>
                <TabsTrigger value="json" className="gap-2 text-xs">
                  <Code2 className="w-3 h-3" /> JSON
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent 
              value="builder" 
              className="flex-1 relative m-0 border-none outline-none data-[state=active]:flex flex-col min-h-0"
            >
              <ScrollArea className="h-full w-full">
                <div className="space-y-6 pb-10 px-4 pt-4">
                  <section className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">General Info</h3>
                    <div className="grid gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Display Name</Label>
                        <Input 
                          className="h-8 text-xs"
                          value={schema.label} 
                          onChange={(e) => updateSchema("label", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          className="h-8 text-xs"
                          value={schema.description} 
                          onChange={(e) => updateSchema("description", e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Internal Type</Label>
                          <Input 
                            className="h-8 text-xs font-mono"
                            value={schema.type} 
                            onChange={(e) => updateSchema("type", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Category</Label>
                          <Input 
                            className="h-8 text-xs"
                            value={schema.category} 
                            onChange={(e) => updateSchema("category", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Parameters</h3>
                      <Button onClick={addParameter} variant="ghost" className="h-6 px-2 text-[10px] gap-1 hover:bg-primary/10">
                        <Plus className="w-3 h-3" /> Add Input
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {schema.parameters.map((param) => (
                        <Card key={param.id} className="p-3 bg-background shadow-none border-border/50 space-y-3">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Input 
                                className="h-7 text-[11px] font-medium bg-muted/20 border-transparent focus-visible:border-border" 
                                value={param.label} 
                                onChange={(e) => updateParameter(param.id, { label: e.target.value })}
                              />
                              <Button onClick={() => removeParameter(param.id)} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select value={param.type} onValueChange={(v) => updateParameter(param.id, { type: v })}>
                                <SelectTrigger className="h-6 text-[10px] px-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="string">String</SelectItem>
                                  <SelectItem value="number">Number</SelectItem>
                                  <SelectItem value="boolean">Boolean</SelectItem>
                                  <SelectItem value="enum">Enum</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center justify-between px-2 bg-muted/40 rounded border border-transparent h-6">
                                <span className="text-[9px] font-medium text-muted-foreground">Inferable</span>
                                <Switch 
                                  checked={param.canConnect} 
                                  onCheckedChange={(v) => updateParameter(param.id, { canConnect: v })}
                                  className="scale-[0.6] origin-right"
                                />
                              </div>
                            </div>
                          </div>

                          {param.type === "enum" && (
                            <div className="space-y-2 border-t pt-2">
                              <Label className="text-[9px] uppercase font-bold text-muted-foreground">Options</Label>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {param.values?.map((v) => (
                                  <Badge key={v} variant="secondary" className="text-[9px] py-0 px-1.5 gap-1" onClick={(e) => {
                                        e.preventDefault();
                                        removeEnumValue(param.id, v);
                                      }}>
                                    {v}
                                    <X 
                                      className="w-2 h-2 cursor-pointer hover:text-destructive" 
                                    />
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-1">
                                <Input 
                                  className="h-6 text-[10px]" 
                                  placeholder="Add value..." 
                                  value={newEnumValue[param.id] || ""}
                                  onChange={(e) => setNewEnumValue(prev => ({ ...prev, [param.id]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && addEnumValue(param.id)}
                                />
                                <Button size="icon" className="h-6 w-6 shrink-0" onClick={() => addEnumValue(param.id)}>
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Outputs</h3>
                      <Button onClick={addOutput} variant="ghost" className="h-6 px-2 text-[10px] gap-1 hover:bg-primary/10">
                        <Plus className="w-3 h-3" /> Add Output
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      {schema.outputs.map((output) => (
                        <div key={output.id} className="flex items-center gap-2 group">
                          <div className="w-1 h-6 bg-orange-400/60 rounded-full" />
                          <Input 
                            className="h-7 text-[11px] bg-transparent border-transparent group-hover:border-border focus:bg-background" 
                            value={output.label} 
                            onChange={(e) => updateOutput(output.id, { label: e.target.value })}
                          />
                          <Button onClick={() => removeOutput(output.id)} variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json" className="flex-1 m-0 overflow-hidden bg-zinc-950 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
                  {renderJsonWithSyntaxHighlighting(schema)}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75} className="relative">
          <main className="w-full h-full bg-background overflow-hidden">
            <ReactFlowProvider>
              <div className="w-full h-full">
                <ReactFlow
                  nodes={nodes}
                  edges={[]}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.8 }}
                >
                  <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" />
                </ReactFlow>
              </div>
            </ReactFlowProvider>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}