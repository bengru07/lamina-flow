"use client"

import { useState, useEffect } from "react"
import { FolderSearch, MoreHorizontal, Plus, Search, Triangle, X, Loader2, Trash2, CheckCircle2, FileCode, FolderOpen, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { RootState } from "@/redux/store"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { createWorkspace, deleteWorkspace, fetchWorkspace, fetchWorkspaces } from "@/redux/workspaces/WorkspaceThunk"
import { ProjectCreateDialog } from "@/components/app/create-project-dialog"
import { ProjectDeleteDialog } from "@/components/app/delete-project-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function Page() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const workspaces = useAppSelector((state: RootState) => state.workspaces.list)
  const status = useAppSelector((state: RootState) => state.workspaces.requests.fetchWorkspaces)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    dispatch(fetchWorkspaces())
  }, [dispatch])

  const filteredProjects = workspaces.filter((project: any) =>
    project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onClear = () => setSearchQuery("")

  const handleDeleteProject = (uuid: string) => {
    dispatch(deleteWorkspace(uuid))
    setSelectedIds(prev => prev.filter(id => id !== uuid))
  }

  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      dispatch(deleteWorkspace(id))
    })
    setSelectedIds([])
  }

  const toggleSelect = (uuid: string) => {
    setSelectedIds(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid) 
        : [...prev, uuid]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProjects.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredProjects.map((p: any) => p.uuid))
    }
  }

  const handleOpenProject = (uuid: string) => {
    dispatch(fetchWorkspace(uuid)).then(() => {
      router.push(`/app/projects/${uuid}`);
    })
  }

  return (
    <div className="flex-1 p-8 pt-2 max-w-7xl mx-auto w-full">
      <div className="sticky top-16 bg-background z-20 px-8 pt-8 pb-6 border-b">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-semibold tracking-tight">Projects</h1>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-10 bg-muted/20 border-muted focus-visible:ring-1"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredProjects.length > 0 && (
               <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleSelectAll}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {selectedIds.length === filteredProjects.length ? "Deselect All" : "Select All"}
              </Button>
            )}

            <ProjectCreateDialog>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Project
              </Button>
            </ProjectCreateDialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-8 pt-6 flex-1">
        {status === "pending" && workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 pb-20">
            {filteredProjects.map((project: any) => {
              const isSelected = selectedIds.includes(project.uuid);
              const isPlaceholder = project?.thumbnailUrl?.includes('placeholder') || !project?.thumbnailUrl;

              return (
                <div 
                  key={project.uuid} 
                  className={`group relative cursor-pointer rounded-xl transition-all p-1 -m-1 ${isSelected ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                  onClick={() => handleOpenProject(project.uuid)}
                >
                  <div className={`relative aspect-video rounded-lg border overflow-hidden mb-3 ${project?.isDarkThumbnail ? "bg-[#0a0a0a]" : "bg-white"}`}>
                    {!isPlaceholder ? (
                      <img
                        src={project.thumbnailUrl}
                        alt={project.name}
                        className={`w-full h-full object-cover transition-all ${
                          isSelected ? 'opacity-100 scale-105' : 'opacity-90 group-hover:opacity-100'
                        }`}
                      />
                    ) : (
                      <div className={cn(
                        "w-full h-full relative flex flex-col items-center justify-center p-6 transition-all",
                        isSelected ? "bg-accent/20 scale-105" : "bg-muted/10 group-hover:bg-muted/20"
                      )}>
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden text-foreground">
                          
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center gap-3">
                          <div className={cn(
                            "p-3 rounded-xl border shadow-sm transition-colors",
                            isSelected ? "bg-background border-primary/50 text-primary" : "bg-background/80 border-border text-muted-foreground"
                          )}>
                            <FolderOpen size={28} strokeWidth={1.5} />
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                              {project?.name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 max-w-[180px]">
                              {project?.category || "No description available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={`absolute top-3 left-3 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleSelect(project.uuid)}
                        className="bg-background shadow-lg border-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between px-1">
                    <div className="flex gap-3">
                      <div className="mt-1 w-6 h-6 rounded bg-foreground flex items-center justify-center">
                        <Workflow className="h-3 w-3 fill-background text-background" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium leading-none mb-1.5">
                          {project?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {project?.lastUpdated ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    
                   <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleOpenProject(project.uuid)}>
                          Open
                        </DropdownMenuItem>
                        
                        <ProjectDeleteDialog 
                          workspaceId={project.uuid} 
                          deleteCallback={() => handleDeleteProject(project.uuid)}
                        >
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </ProjectDeleteDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center border-dashed bg-muted/10 py-12">
            <Empty className="mt-16">
              <EmptyHeader>
                <EmptyMedia>
                  <FolderSearch className="h-6 w-6 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No projects found</EmptyTitle>
                <EmptyDescription>
                  {workspaces.length === 0 
                    ? "You haven't created any projects yet." 
                    : `We couldn't find any projects matching "${searchQuery}"`}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex gap-2">
                {searchQuery && (
                  <Button onClick={onClear} variant="outline" size="sm" className="gap-2">
                    <X className="h-4 w-4" />
                    Clear search
                  </Button>
                )}

                <ProjectCreateDialog>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                  </Button>
                </ProjectCreateDialog>
              </EmptyContent>
            </Empty>
          </Card>
        )}
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 backdrop-blur-md">
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 bg-muted/50 px-4 py-2 rounded-md border animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-medium">
              {selectedIds.length} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <ProjectDeleteDialog workspaceId={""} deleteCallback={handleBulkDelete}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </ProjectDeleteDialog>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-2"
              onClick={() => setSelectedIds([])}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}