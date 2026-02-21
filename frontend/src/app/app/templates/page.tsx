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
        templateName: targetTemplate.type.toLowerCase().replace(/\s+/g, '-')
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
    <div className="flex-1 p-8 pt-4 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Node Library</h1>
          <p className="text-muted-foreground text-sm">Manage and deploy workflow nodes.</p>
        </div>
        <Button size="sm" className="h-9 gap-2" onClick={() => router.push('/app/templates/designer')}>
          <Plus className="h-4 w-4" /> New Designer Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 h-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px] h-10">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {requests.fetchLibrary === "pending" ? (
        <div className="flex justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.type} className="group overflow-hidden flex flex-col bg-[#0f0f0f] border-zinc-800 hover:border-zinc-600 transition-all">
              <div className="h-40 bg-[#050505] relative flex items-center justify-center border-b border-zinc-800/50">
                <div className="w-48 bg-[#1a1a1a] border border-zinc-700 rounded-md p-3 space-y-3 scale-90 shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 truncate">{template.label}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      {template.parameters?.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border border-zinc-500" /><div className="w-8 h-1 bg-zinc-800 rounded-full" /></div>
                      ))}
                    </div>
                    <div className="space-y-1 items-end flex flex-col">
                      {template.outputs?.slice(0, 3).map((o: any) => (
                        <div key={o.id} className="flex items-center gap-1.5"><div className="w-8 h-1 bg-zinc-800 rounded-full" /><div className="w-1.5 h-1.5 rounded-full bg-zinc-400" /></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100">{template.label}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">{template.type}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#111] border-zinc-800 text-zinc-300">
                      <DropdownMenuItem onClick={() => router.push(`/app/templates/designer/${template.type}`)} className="gap-2">
                        <Edit2 className="h-4 w-4" /> Edit Designer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTargetTemplate(template)} className="gap-2">
                        <Send className="h-4 w-4" /> Push to Project
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-800" />
                      <DropdownMenuItem className="text-red-400 gap-2 focus:text-red-400 focus:bg-red-400/10" onClick={() => dispatch(deleteLibraryTemplate(template.label))}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 italic">{template.description || "No description."}</p>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <Badge variant="outline" className="text-[9px] border-zinc-800 text-zinc-500 uppercase">{template.category}</Badge>
                  <Button variant="link" size="sm" className="h-auto p-0 text-zinc-400 hover:text-primary text-[11px] gap-1" onClick={() => setTargetTemplate(template)}>
                    Deploy <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 flex flex-col items-center border border-dashed border-zinc-800 rounded-xl">
          <Package className="h-10 w-10 text-zinc-800 mb-4" />
          <p className="text-sm text-zinc-500">Your node library is empty.</p>
        </div>
      )}

      <Dialog open={!!targetTemplate} onOpenChange={() => setTargetTemplate(null)}>
        <DialogContent className="bg-[#0f0f0f] border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Deploy Template</DialogTitle>
            <DialogDescription className="text-zinc-400">Select a project to inject the <span className="text-zinc-100 font-bold">{targetTemplate?.label}</span> node.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select onValueChange={setSelectedWorkspaceId} value={selectedWorkspaceId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Select a project" /></SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                {workspaces.map((ws) => <SelectItem key={ws.uuid} value={ws.uuid}>{ws.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTargetTemplate(null)} className="text-zinc-400">Cancel</Button>
            <Button disabled={!selectedWorkspaceId || isPushing} onClick={handlePushToProject}>
              {isPushing && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Deploy Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}