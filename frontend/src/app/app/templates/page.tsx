"use client"

import React, { useState, useCallback } from "react"
import { Layers, Code2 } from "lucide-react"
import { ReactFlowProvider } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { SidebarConfig } from "@/components/templating/sidebar"
import { NodePreview } from "@/components/templating/preview"
import { NodeSchema } from "@/components/templating/types"
import { CopyButton } from "@/components/ui/button-copy"

const INITIAL_SCHEMA: NodeSchema = {
  label: "New Node Template",
  category: "General",
  type: "custom_node",
  description: "Description of what this node does.",
  parameters: [{ id: "input_1", label: "Example Input", type: "string", value: "Default", canConnect: true, values: [] }],
  outputs: [{ id: "output_1", label: "Result", type: "string" }]
}

export default function NodeTemplateBuilder() {
  const [schema, setSchema] = useState<NodeSchema>(INITIAL_SCHEMA)
  const [activeTab, setActiveTab] = useState("builder")

  const updateSchema = (field: string, value: any) => setSchema(p => ({ ...p, [field]: value }))
  
  const updateParameter = useCallback((id: string, updates: any) => {
    setSchema(prev => ({
      ...prev,
      parameters: prev.parameters.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  }, [])

  const addParameter = () => {
    const id = `param_${Math.random().toString(36).substr(2, 5)}`
    updateSchema("parameters", [...schema.parameters, { id, label: "New Parameter", type: "string", value: "", canConnect: true, values: [] }])
  }

  const renderJsonWithSyntaxHighlighting = (obj: any) => {
    const json = JSON.stringify(obj, null, 3);
    return (
      <div className="font-mono text-[13px] leading-6 bg-[#0a0a0a] rounded-lg border border-zinc-800/50 overflow-hidden">
        <div className="absolute right-2 top-2 z-10">
          <CopyButton text={JSON.stringify(obj, null, 3)} />
        </div>
        {json.split('\n').map((line, i) => (
          <div key={i} className="flex group hover:bg-zinc-900/50 transition-colors">
            <div className="w-12 shrink-0 text-right pr-4 select-none text-zinc-600 border-r border-zinc-800/30 group-hover:text-zinc-400">
              {i + 1}
            </div>
            
            <div className="pl-4 whitespace-pre">
              {line.split(/(".*?")/).map((part, j) => {
                if (part.startsWith('"') && part.endsWith('"')) {
                  if (line.includes(`${part}:`)) {
                    return <span key={j} className="text-pink-400 opacity-90">{part}</span>;
                  }
                  return <span key={j} className="text-emerald-400">{part}</span>;
                }
                
                // Numbers
                if (/\d+/.test(part) && !line.includes(`"${part}"`)) {
                  return <span key={j} className="text-orange-300">{part}</span>;
                }
                
                // Booleans and Null
                if (/(true|false|null)/.test(part)) {
                  return <span key={j} className="text-sky-400 font-semibold">{part}</span>;
                }
                
                // Punctuation and whitespace
                return <span key={j} className="text-zinc-500">{part}</span>;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r bg-muted/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-4rem)] overflow-y-auto flex flex-col">
            <div className="px-3 pt-3">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="builder" className="gap-2 text-xs"><Layers className="w-3 h-3" /> Template</TabsTrigger>
                <TabsTrigger value="json" className="gap-2 text-xs"><Code2 className="w-3 h-3" /> JSON</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="builder" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <SidebarConfig 
                  schema={schema}
                  updateSchema={updateSchema}
                  updateParameter={updateParameter}
                  addParameter={addParameter}
                  removeParameter={(id) => updateSchema("parameters", schema.parameters.filter(p => p.id !== id))}
                  addOutput={() => updateSchema("outputs", [...schema.outputs, { id: `out_${Math.random()}`, label: "New Output", type: "string" }])}
                  removeOutput={(id) => updateSchema("outputs", schema.outputs.filter(o => o.id !== id))}
                  updateOutput={(id, updates) => updateSchema("outputs", schema.outputs.map(o => o.id === id ? { ...o, ...updates } : o))}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json" className="flex-1 bg-zinc-950 overflow-hidden p-3">
              <ScrollArea className="h-full text-[11px]">{renderJsonWithSyntaxHighlighting(schema)}</ScrollArea>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75}>
          <ReactFlowProvider>
            <NodePreview schema={schema} />
          </ReactFlowProvider>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}