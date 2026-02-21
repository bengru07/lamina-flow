"use client"

import React, { useState, useMemo, useEffect } from "react"
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  SlidersHorizontal, 
  ArrowUpDown,
  X,
  Box,
  CircleDot,
  Zap,
  Play,
  Square,
  Loader2,
  Trash2,
  ExternalLink,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchDeployments, activateDeployment, clearAllDeployments, deactivateDeployment } from "@/redux/execution/ExecutionThunk"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

export default function DeploymentsPage() {
  const dispatch = useAppDispatch()
  const { deployments, requests } = useAppSelector((state) => state.execution)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeProjectFilter, setActiveProjectFilter] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchDeployments())
  }, [dispatch])

  const filteredDeployments = useMemo(() => {
    return deployments.filter((dep: any) => {
      const name = dep.metadata?.name || dep.reference_id
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesProject = activeProjectFilter ? dep.metadata?.workspace?.name === activeProjectFilter : true
      return matchesSearch && matchesProject
    })
  }, [deployments, searchQuery, activeProjectFilter])

  const uniqueProjects = useMemo(() => {
    const names = deployments.map((d: any) => d.metadata?.workspace?.name).filter(Boolean)
    return Array.from(new Set(names))
  }, [deployments])

  return (
    <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-white">Deployments</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => dispatch(clearAllDeployments())}
            className="text-destructive hover:bg-destructive/10 border-destructive/20"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear Memory
          </Button>
          <Button size="sm" variant="secondary" onClick={() => dispatch(fetchDeployments())}>
            <Activity className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search deployments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/10 border-muted focus-visible:ring-1"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10">
            <ExternalLink className="h-4 w-4" />
            Export
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9 text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter Project
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-black border-zinc-800" align="start">
              <div className="flex items-center px-3 py-2 border-b border-zinc-800">
                <Box className="h-4 w-4 mr-2 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">Workspaces</span>
              </div>
              <div className="p-2 space-y-1">
                {uniqueProjects.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">No projects found</div>
                )}
                {uniqueProjects.map((projectName) => (
                  <button
                    key={projectName}
                    onClick={() => setActiveProjectFilter(projectName)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-xs text-zinc-300 transition-colors"
                  >
                    <CircleDot className="h-3 w-3" />
                    {projectName}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {activeProjectFilter && (
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 gap-2">
              <span className="text-xs text-zinc-300">{activeProjectFilter}</span>
              <button onClick={() => setActiveProjectFilter(null)} className="hover:text-white text-zinc-500">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border border-zinc-800">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow className="hover:bg-transparent border-zinc-800">
              <TableHead className="w-[40%] font-medium text-muted-foreground">Deployment Name</TableHead>
              <TableHead className="font-medium text-muted-foreground text-center">Status</TableHead>
              <TableHead className="font-medium text-muted-foreground">
                <div className="flex items-center gap-1">Workspace <ArrowUpDown className="h-3 w-3" /></div>
              </TableHead>
              <TableHead className="text-right font-medium text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.fetchDeployments === "pending" && deployments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredDeployments.map((dep: any) => {
              const depId = dep.reference_id
              const isRunning = dep.metadata.status == "active"
              
              return (
                <TableRow key={depId} className="group border-zinc-800 hover:bg-muted/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center border transition-colors",
                        isRunning ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/20 border-zinc-800 text-zinc-500"
                      )}>
                        <Zap size={14} className={isRunning ? "fill-primary" : ""} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{dep.metadata?.name || "Untitled Deployment"}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{depId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isRunning ? "default" : "secondary"} className={cn(
                      "text-[10px] px-2 py-0",
                      isRunning && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                    )}>
                      {isRunning ? "ACTIVE" : "IDLE"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Box className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-sm text-zinc-400">{dep.metadata?.workspace?.name || "Global"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant={isRunning ? "destructive" : "secondary"}
                        size="sm"
                        className="h-8 gap-2 z-10"
                        disabled={requests.activate === "pending"}
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          if (isRunning) {
                            dispatch(deactivateDeployment(depId)).then(() => dispatch(fetchDeployments()));
                          } else {
                            dispatch(activateDeployment(depId)).then(() => dispatch(fetchDeployments()));
                          }
                        }}
                      >
                        {
                          requests.activate == "pending" ? (
                            <Spinner className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              {isRunning ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                              {isRunning ? "Stop" : "Run"}
                            </>
                          )
                        }
                        
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {filteredDeployments.length === 0 && requests.fetchDeployments !== "pending" && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-muted/20 mb-4">
            <Box className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-white">No active deployments</p>
          <p className="text-xs text-muted-foreground mt-1">Deploy workflows from your projects to manage them here.</p>
        </div>
      )}
    </main>
  )
}