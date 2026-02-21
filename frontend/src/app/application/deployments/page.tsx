"use client"

import * as React from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { useEffect, useMemo, useState } from "react"
import { fetchDeployments, clearAllDeployments } from "@/redux/execution/ExecutionThunk"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Trash2, RefreshCcw, Filter, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Page() {
  const dispatch = useAppDispatch()
  const deployments = useAppSelector((state) => state.execution.deployments)
  const isLoading = useAppSelector((state) => state.execution.requests.fetchDeployments === "pending")
  
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    dispatch(fetchDeployments())
  }, [dispatch])

  const workspaces = useMemo(() => {
    const map = new Map()
    deployments.forEach(d => {
      if (d.metadata?.workspace) {
        map.set(d.metadata.workspace.uuid, d.metadata.workspace.name)
      }
    })
    return Array.from(map.entries())
  }, [deployments])

  const filteredData = useMemo(() => {
    return deployments.filter(d => {
      const matchesWorkspace = selectedWorkspace === "all" || d.metadata?.workspace?.uuid === selectedWorkspace
      const matchesSearch = (d.metadata?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesWorkspace && matchesSearch
    })
  }, [deployments, selectedWorkspace, searchQuery])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background text-foreground">
      <div className="px-8 pt-8 pb-6 border-b dark:border-border">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight uppercase">Deployments</h1>
            <div className="bg-neutral-100 dark:bg-white/5 text-neutral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border dark:border-white/5">
              {deployments.length} Records
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-none border dark:border-white/10 text-[10px] font-bold uppercase tracking-tight hover:text-red-500"
              onClick={() => dispatch(clearAllDeployments())}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Clear All
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-none border dark:border-white/10 text-[10px] font-bold uppercase tracking-tight"
              onClick={() => dispatch(fetchDeployments())} 
              disabled={isLoading}
            >
              <RefreshCcw className={cn("mr-2 h-3.5 w-3.5", isLoading && "animate-spin")} /> Sync
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Search ID or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-none bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/10 text-xs focus-visible:ring-0 focus-visible:border-neutral-400"
            />
          </div>
          
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-[200px] h-9 rounded-none bg-neutral-50 dark:bg-white/[0.02] border-neutral-200 dark:border-white/10 text-xs font-bold uppercase">
              <SelectValue placeholder="Workspace" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-neutral-200 dark:border-border">
              <SelectItem value="all" className="text-xs uppercase font-bold">All Workspaces</SelectItem>
              {workspaces.map(([id, name]) => (
                <SelectItem key={id} value={id} className="text-xs uppercase font-bold">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <DataTable 
          columns={columns} 
          data={filteredData} 
          title="Execution Instance List"
          meta={{ dispatch }}
        />
      </div>
    </div>
  )
}