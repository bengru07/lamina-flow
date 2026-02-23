"use client"

import React, { useState, useMemo, useEffect } from "react"
import { 
  Plus, Github, LayoutGrid, Monitor, ArrowUp, X, FolderOpen, 
  Triangle, MoreHorizontal, Loader2, CheckCircle2, ChevronDown, MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchWorkspaces, deleteWorkspace, fetchWorkspace } from "@/redux/workspaces/WorkspaceThunk"
import { fetchSettings } from "@/redux/settings/SettingsThunk"
import { sendChatRequest } from "@/redux/ai/AiThunk"
import { ProjectCreateDialog } from "@/components/app/create-project-dialog"
import { ProjectDeleteDialog } from "@/components/app/delete-project-dialog"
import { ChatInterface } from "@/components/app/chat-interface"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function Page() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  
  const workspaces = useAppSelector((state) => state.workspaces.list)
  const status = useAppSelector((state) => state.workspaces.requests.fetchWorkspaces)
  const settings = useAppSelector((state) => state.settings.values)
  const aiStatus = useAppSelector((state) => state.ai.status)
  
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [prompt, setPrompt] = useState("")
  const [selectedContextProjects, setSelectedContextProjects] = useState<any[]>([])
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])

  useEffect(() => {
    dispatch(fetchWorkspaces())
    dispatch(fetchSettings())
  }, [dispatch])

  useEffect(() => {
    if (settings.ai_providers?.length > 0 && !selectedProvider) {
      const active = settings.ai_providers.find((p: any) => p.enabled) || settings.ai_providers[0]
      setSelectedProvider(active)
    }
  }, [settings.ai_providers, selectedProvider])

  const handleSendMessage = async (content: string) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setShowChat(true)

    try {
      const result = await dispatch(sendChatRequest({
        prompt: content,
        provider_id: selectedProvider.id,
        workspace_ids: selectedContextProjects.map(p => p.uuid)
      })).unwrap()
      
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.response,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      toast.error("Failed to get AI response")
    }
  }

  const handleSendPrompt = () => {
    if (!prompt.trim()) return
    handleSendMessage(prompt)
    setPrompt("")
  }

  const recentProjects = useMemo(() => {
    return [...workspaces].sort((a: any, b: any) => 
      new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime()
    ).slice(0, 3)
  }, [workspaces])

  const toggleContextProject = (project: any) => {
    setSelectedContextProjects(prev => 
      prev.find(p => p.uuid === project.uuid)
        ? prev.filter(p => p.uuid !== project.uuid)
        : [...prev, project]
    )
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6">
        <div className="mb-8">
          <Badge variant="secondary" className="rounded-full px-4 py-1 gap-2 font-normal">
            <span className="bg-emerald-500 text-[10px] text-white px-1 rounded font-bold">New</span>
            Introducing multi-project context for production workflows
          </Badge>
        </div>

        <h1 className="text-4xl font-semibold mb-8 tracking-tight">What do you want to do?</h1>

        <div className="w-full relative bg-card border rounded-xl shadow-sm mb-6 transition-all focus-within:ring-1 focus-within:ring-primary/20">
          <textarea 
            placeholder="Ask to build or analyze..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendPrompt()
              }
            }}
            className="w-full min-h-[140px] p-4 bg-transparent resize-none focus:outline-none text-md"
          />
          
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {selectedContextProjects.map((project) => (
              <Badge key={project.uuid} variant="secondary" className="pl-2 pr-1 py-1 gap-1 border-primary/20 bg-primary/5 text-primary animate-in zoom-in-95">
                <FolderOpen className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{project.name}</span>
                <button onClick={() => toggleContextProject(project)} className="hover:bg-primary/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between p-2 border-t mt-2">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    Add Project Context
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="p-2 border-b bg-muted/20">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-2">Select Projects</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {workspaces.map((project: any) => {
                      const isSelected = selectedContextProjects.find(p => p.uuid === project.uuid)
                      return (
                        <button key={project.uuid} onClick={() => toggleContextProject(project)} className={cn("w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors", isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted")}>
                          <div className="flex items-center gap-2 truncate">
                            <FolderOpen className="h-3.5 w-3.5" />
                            <span className="truncate">{project.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8">
                    <Monitor className="h-3.5 w-3.5" />
                    {selectedProvider ? selectedProvider.name : "Select Model"}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {settings.ai_providers?.map((provider: any) => (
                    <DropdownMenuItem key={provider.id} onClick={() => setSelectedProvider(provider)} className={cn("flex items-center justify-between", !provider.enabled && "opacity-50")}>
                      <span className="flex items-center gap-2">
                         <span className={cn("w-1.5 h-1.5 rounded-full", provider.enabled ? "bg-emerald-500" : "bg-zinc-500")} />
                         {provider.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">{provider.service_type}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="icon" className="h-8 w-8 rounded-md" disabled={!prompt.trim() || aiStatus === 'pending'} onClick={handleSendPrompt}>
              {aiStatus === 'pending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <ProjectCreateDialog>
            <Button variant="outline" className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </ProjectCreateDialog>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => router.push('/app/projects')}>
            <LayoutGrid className="h-4 w-4" /> View All Projects
          </Button>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-4 w-4" /> {showChat ? "Hide Chat" : "Open Chat History"}
          </Button>
        </div>

        <div className="w-full mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Projects</h2>
            <Button variant="link" size="sm" className="text-muted-foreground" onClick={() => router.push('/app/projects')}>
              View All Projects &gt;
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {status === "pending" && workspaces.length === 0 ? (
               <div className="col-span-full flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : recentProjects.map((project: any) => (
              <Card key={project.uuid} className="group p-4 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md relative overflow-hidden" onClick={() => router.push(`/app/projects/${project.uuid}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded bg-foreground flex items-center justify-center shrink-0">
                    <Triangle className="h-4 w-4 fill-background text-background" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ProjectDeleteDialog workspaceId={project.uuid} deleteCallback={() => dispatch(deleteWorkspace(project.uuid))}>
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                      </ProjectDeleteDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm truncate">{project.name}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">Updated {project.lastUpdated || "recently"}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {showChat && (
        <ChatInterface 
          isOverlay
          messages={chatMessages}
          isLoading={aiStatus === 'pending'}
          providerName={selectedProvider?.name}
          onSendMessage={handleSendMessage}
          onClearHistory={() => setChatMessages([])}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}