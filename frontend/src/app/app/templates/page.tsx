"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Search, Plus, MoreHorizontal, Loader2, Trash2, Send, Package, ArrowRight, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchLibraryTemplates, deleteLibraryTemplate, addTemplateToWorkspace } from "@/redux/templates/TemplateThunk"
import { fetchWorkspaces } from "@/redux/workspaces/WorkspaceThunk"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { NodePreview } from "@/components/templating/preview"
import { ReactFlowProvider } from "@xyflow/react"

export default function NodeTemplatesPage() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { library, requests } = useAppSelector((state) => state.templates)
  const workspaces = useAppSelector((state) => state.workspaces.list)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [targetTemplate, setTargetTemplate] = useState<any | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("")
  const [isPushing, setIsPushing] = useState(false)

  useEffect(() => {
    dispatch(fetchLibraryTemplates())
    dispatch(fetchWorkspaces())
  }, [dispatch])

  const categories = useMemo(() => {
    const cats = new Set(library.map(t => t.category))
    return ["all", ...Array.from(cats)]
  }, [library])

  const filteredTemplates = library.filter(t => 
    (t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.type.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (selectedCategory === "all" || t.category === selectedCategory)
  )

  const handlePushToProject = async () => {
    if (!selectedWorkspaceId || !targetTemplate) return
    setIsPushing(true)
    try {
      await dispatch(addTemplateToWorkspace({
        workspaceId: selectedWorkspaceId,
        templateName: targetTemplate.type
      })).unwrap()
      toast.success(`Added ${targetTemplate.type} to project`)
      setTargetTemplate(null)
    } catch (error) {
      toast.error("Failed to add template")
    } finally {
      setIsPushing(false)
    }
  }

  return (
    <div className="flex-1 px-14 pt-7 max-w-7xl mx-auto w-full space-y-8 bg-background text-foreground">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-8 border-border">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-1 text-foreground">Node Library</h1>
          <p className="text-muted-foreground text-sm">Manage and deploy workflow nodes.</p>
        </div>
        <Button size="sm" className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push('/app/templates/designer')}>
          <Plus className="h-4 w-4" /> New Node Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            className="pl-10 h-10 bg-muted/50 border-border focus-visible:ring-ring" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 bg-muted/50 border-border text-foreground">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border text-popover-foreground">
            {categories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {requests.fetchLibrary === "pending" ? (
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card onClick={() => router.push(`/app/templates/designer/${template.type}`)} key={template.type} className="group overflow-hidden flex flex-col bg-card border-border hover:border-muted-foreground/50 transition-all shadow-none">
              <div className="h-48 bg-muted/30 relative border-b border-border/50 overflow-hidden">
                <ReactFlowProvider>
                  <NodePreview 
                    data_schema={template.schema} 
                    nodeType={template.type} 
                  />
                </ReactFlowProvider>
                <div className="absolute inset-0 z-50 bg-transparent cursor-default" />
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-card-foreground">{template.label}</h3>
                    <p className="text-[11px] text-muted-foreground font-mono">{template.type}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                      <DropdownMenuItem onClick={(e: any) => {
                        e.stopPropagation();
                        router.push(`/app/templates/designer/${template.type}`);
                      }} className="gap-2">
                        <Edit2 className="h-4 w-4" /> Edit Designer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e: any) => {
                        e.stopPropagation();
                        setTargetTemplate(template);
                      }} className="gap-2">
                        <Send className="h-4 w-4" /> Push to Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive gap-2 focus:text-destructive focus:bg-destructive/10" onClick={() => dispatch(deleteLibraryTemplate(template.label))}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 italic">{template.description || "No description provided for this template."}</p>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-border text-muted-foreground uppercase">{template.category}</Badge>
                  <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground text-[11px] gap-1" onClick={() => setTargetTemplate(template)}>
                    Deploy <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center border border-dashed border-border rounded-xl bg-muted/10">
          <Package className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground font-mono">No nodes found in library.</p>
        </div>
      )}

      <Dialog open={!!targetTemplate} onOpenChange={() => setTargetTemplate(null)}>
        <DialogContent className="bg-popover border-border text-popover-foreground">
          <DialogHeader>
            <DialogTitle>Deploy Template</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a project to inject the <span className="text-foreground font-bold">{targetTemplate?.label}</span> node.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setSelectedWorkspaceId} value={selectedWorkspaceId}>
              <SelectTrigger className="bg-muted/50 border-border text-foreground">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {workspaces.map((ws) => <SelectItem key={ws.uuid} value={ws.uuid}>{ws.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTargetTemplate(null)} className="text-muted-foreground hover:bg-muted hover:text-foreground">Cancel</Button>
            <Button disabled={!selectedWorkspaceId || isPushing} onClick={handlePushToProject} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isPushing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Deploy Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}