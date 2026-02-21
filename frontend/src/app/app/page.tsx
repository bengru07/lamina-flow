"use client"

import React, { useState, useMemo, useEffect } from "react"
import { 
  Search, 
  Plus, 
  Github, 
  LayoutGrid, 
  Monitor, 
  ArrowUp,
  X,
  FolderOpen,
  Triangle,
  MoreHorizontal,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchWorkspaces, deleteWorkspace, fetchWorkspace } from "@/redux/workspaces/WorkspaceThunk"
import { ProjectCreateDialog } from "@/components/app/create-project-dialog"
import { ProjectDeleteDialog } from "@/components/app/delete-project-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function Page() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const workspaces = useAppSelector((state) => state.workspaces.list)
  const status = useAppSelector((state) => state.workspaces.requests.fetchWorkspaces)
  
  const [prompt, setPrompt] = useState("")
  const [selectedContextProjects, setSelectedContextProjects] = useState<any[]>([])

  useEffect(() => {
    dispatch(fetchWorkspaces())
  }, [dispatch])

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
            <span className="text-muted-foreground underline cursor-pointer ml-1">Learn More</span>
          </Badge>
        </div>

        <h1 className="text-4xl font-semibold mb-8 tracking-tight">What do you want to do?</h1>

        <div className="w-full relative bg-card border rounded-xl shadow-sm mb-6 transition-all focus-within:ring-1 focus-within:ring-primary/20">
          <textarea 
            placeholder="Ask to build or analyze..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full min-h-[140px] p-4 bg-transparent resize-none focus:outline-none text-md"
          />
          
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {selectedContextProjects.map((project) => (
              <Badge 
                key={project.uuid} 
                variant="secondary" 
                className="pl-2 pr-1 py-1 gap-1 border-primary/20 bg-primary/5 text-primary animate-in zoom-in-95"
              >
                <FolderOpen className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{project.name}</span>
                <button 
                  onClick={() => toggleContextProject(project)}
                  className="hover:bg-primary/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
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
                        <button
                          key={project.uuid}
                          onClick={() => toggleContextProject(project)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          )}
                        >
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
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Monitor className="h-3.5 w-3.5" />
                  Gemini Pro 1.5
                </Button>
            </div>
            <Button size="icon" className="h-8 w-8 rounded-md" disabled={!prompt.trim()}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <ProjectCreateDialog>
            <Button variant="outline" className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </ProjectCreateDialog>
          <Button variant="outline" className="rounded-full gap-2">
            <Github className="h-4 w-4" /> GitHub Import <Badge className="bg-blue-500 hover:bg-blue-600 h-4 px-1 text-[10px]">New</Badge>
          </Button>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => router.push('/app/projects')}>
            <LayoutGrid className="h-4 w-4" /> View All Projects
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
              <Card 
                key={project.uuid} 
                className="group p-4 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md relative overflow-hidden"
                onClick={() => {
                  dispatch(fetchWorkspace(project.uuid)).then(() => {
                    router.push(`/app/projects/${project.uuid}`)
                  })
                }}
              >
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
                      <ProjectDeleteDialog 
                        workspaceId={project.uuid} 
                        deleteCallback={() => dispatch(deleteWorkspace(project.uuid))}
                      >
                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                          Delete
                        </DropdownMenuItem>
                      </ProjectDeleteDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm truncate">{project.name}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Updated {project.lastUpdated || "recently"}
                  </p>
                </div>
              </Card>
            ))}
            
            {recentProjects.length === 0 && status !== "pending" && (
              <div className="col-span-full p-8 border-dashed border rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                <FolderOpen className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">No projects yet. Create one to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}