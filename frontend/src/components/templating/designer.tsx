"use client"

import React, { useState, useCallback, useEffect } from "react"
import { Layers, Code2, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { ReactFlowProvider } from "@xyflow/react"
import { useRouter, useParams } from "next/navigation"
import "@xyflow/react/dist/style.css"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { SidebarConfig } from "@/components/templating/sidebar"
import { NodePreview } from "@/components/templating/preview"
import { NodeTemplate } from "@/components/templating/types"
import { CopyButton } from "@/components/ui/button-copy"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/api/appDispatcher"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

const INITIAL_STATE: NodeTemplate = {
  label: "New Node Template",
  category: "General",
  type: "custom_node",
  description: "Description of what this node does.",
  schema: {
    label: "New Node Template",
    category: "General",
    parameters: [{ id: crypto.randomUUID(), label: "Example Input", type: "string", value: "Default", canConnect: true, values: [] }],
    outputs: [{ id: crypto.randomUUID(), label: "Result", type: "string" }]
  }
}

export default function NodeTemplateBuilder() {
  const params = useParams()
  const router = useRouter()
  const slugType = params.slug
  const library = useAppSelector((state) => state.templates.library)
  
  const [template, setTemplate] = useState<NodeTemplate>(INITIAL_STATE)
  const [activeTab, setActiveTab] = useState("builder")
  const [jsonInput, setJsonInput] = useState("")
  const [isLoading, setIsLoading] = useState(!!slugType)
  
  useEffect(() => {
    if (!slugType) {
      setTemplate(INITIAL_STATE);
      setIsLoading(false);
      return;
    }

    if (library && library.length > 0) {
      const existing = library.find(t => t.type === slugType);
      
      if (existing) {
        setTemplate(existing);
      } else {
        toast.error("Template not found.");
        router.replace('/app/templates/designer');
      }
      setIsLoading(false);
    } else if (library && library.length === 0) {
      const timeout = setTimeout(() => {
        if (isLoading) {
          toast.error("Template library unavailable.");
          router.replace('/app/templates/designer');
          setIsLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [slugType, library, router]);

  const updateRootField = (field: keyof NodeTemplate, value: any) => {
    setTemplate(prev => ({ 
      ...prev, 
      [field]: value,
      schema: (field === 'label' || field === 'category') 
        ? { ...prev.schema, [field]: value } 
        : prev.schema
    }))
  }

  const updateInnerSchema = (field: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      schema: { ...prev.schema, [field]: value }
    }))
  }
  
  const updateParameter = useCallback((id: string, updates: any) => {
    setTemplate(prev => ({
      ...prev,
      schema: {
        ...prev.schema,
        parameters: prev.schema.parameters.map(p => p.id === id ? { ...p, ...updates } : p)
      }
    }))
  }, [])

  const handleSyncJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (!parsed.type || !parsed.schema) throw new Error("Invalid Format")
      setTemplate(parsed)
      toast.success("Designer synced from JSON")
      setActiveTab("builder")
    } catch (e) {
      toast.error("Failed to parse JSON. Ensure 'type' and 'schema' are present.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          <p className="text-xs text-zinc-500 font-mono">Loading Template Definition...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="border-r bg-muted/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-3 pt-3 border-b border-zinc-900 pb-3">
              <TabsList className="grid w-full grid-cols-3 h-8 bg-zinc-900">
                <TabsTrigger value="builder" className="gap-2 text-xs"><Layers className="w-3 h-3" /> Designer</TabsTrigger>
                <TabsTrigger value="json" className="gap-2 text-xs"><Code2 className="w-3 h-3" /> JSON</TabsTrigger>
                <TabsTrigger value="json-edit" className="gap-2 text-xs"><AlertCircle className="w-3 h-3" /> Import</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="builder" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                <SidebarConfig 
                  template={template}
                  updateRootField={updateRootField}
                  updateParameter={updateParameter}
                  addParameter={() => updateInnerSchema("parameters", [...template.schema.parameters, { id: crypto.randomUUID(), label: "New Parameter", type: "string", value: "", canConnect: true, values: [] }])}
                  removeParameter={(id) => updateInnerSchema("parameters", template.schema.parameters.filter(p => p.id !== id))}
                  addOutput={() => updateInnerSchema("outputs", [...template.schema.outputs, { id: crypto.randomUUID(), label: "New Output", type: "string" }])}
                  removeOutput={(id) => updateInnerSchema("outputs", template.schema.outputs.filter(o => o.id !== id))}
                  updateOutput={(id, updates) => updateInnerSchema("outputs", template.schema.outputs.map(o => o.id === id ? { ...o, ...updates } : o))}
                />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="json" className="flex-1 bg-zinc-950 overflow-hidden p-3 m-0">
              <ScrollArea className="h-[calc(100vh-8rem)]">
                 <div className="p-4 font-mono text-xs text-zinc-400">
                    <pre>{JSON.stringify(template, null, 3)}</pre>
                 </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json-edit" className="flex-1 bg-zinc-950 p-4 m-0 space-y-4">
               <div className="flex flex-col gap-2 h-full">
                  <div className="text-[10px] uppercase text-zinc-500 font-bold">Paste JSON Schema</div>
                  <textarea 
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
                    placeholder='{ "label": "My Node", "type": "...", "schema": { ... } }'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <Button onClick={handleSyncJson} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                    Sync to Designer
                  </Button>
               </div>
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={75}>
          <div className="h-full w-full relative">
            <div className="absolute top-4 left-4 z-10">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-md border-zinc-800 px-3 py-1">
                    {slugType ? `Editing: ${slugType}` : "Drafting New Template"}
                </Badge>
            </div>
            <ReactFlowProvider>
              <NodePreview data_schema={template.schema} nodeType={template.type} />
            </ReactFlowProvider>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}