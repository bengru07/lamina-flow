'use client'

import { useEffect, useMemo, useState } from "react"
import {
  MoreHorizontal,
  RefreshCcw,
  Trash2,
  Zap,
  StopCircle,
  PlayCircle,
  Filter,
  Activity,
  Box,
  Copy,
  ChevronRight,
  Terminal,
  Cpu
} from "lucide-react"

import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchDeployments, activateDeployment, clearAllDeployments, deactivateDeployment } from "@/redux/execution/ExecutionThunk"
import { cn } from "@/lib/utils"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"

export default function DeploymentDashboard() {
  const dispatch = useAppDispatch()
  const deployments = useAppSelector((state) => state.execution.deployments)
  const results = useAppSelector((state) => state.execution.lastExecutionResults)
  const isLoading = useAppSelector((state) => state.execution.requests.fetchDeployments === "pending")
  
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewingDeployment, setViewingDeployment] = useState<any | null>(null)

  useEffect(() => {
    dispatch(fetchDeployments())
  }, [dispatch])

  const enrichedDeployments = useMemo(() => {
    const sorted = [...deployments].sort((a, b) => 
      new Date(a.metadata?.createdAt || 0).getTime() - new Date(b.metadata?.createdAt || 0).getTime()
    );

    const nameCounters: Record<string, number> = {};
    
    return sorted.map((d) => {
      const name = d.metadata?.name || "Unnamed Workflow";
      nameCounters[name] = (nameCounters[name] || 0) + 1;
      return {
        ...d,
        runIndex: nameCounters[name],
        workspaceId: d.metadata?.workspace?.uuid || "unassigned"
      };
    }).reverse(); 
  }, [deployments]);

  const workspaces = useMemo(() => {
    const map = new Map();
    deployments.forEach(d => {
      if (d.metadata?.workspace) {
        map.set(d.metadata.workspace.uuid, d.metadata.workspace.name);
      }
    });
    return Array.from(map.entries());
  }, [deployments]);

  const filteredDeployments = enrichedDeployments.filter(d => {
    const matchesWorkspace = selectedWorkspace === "all" || d.workspaceId === selectedWorkspace;
    const matchesSearch = d.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.includes(searchQuery);
    return matchesWorkspace && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B0E14] text-foreground transition-colors">
      {/* Platform Header */}
      <header className="px-8 pt-8 pb-4 border-b dark:border-white/5 bg-white dark:bg-[#0B0E14]">
        <div className="flex items-center gap-2 mb-6 text-muted-foreground">
            <span className="text-sm hover:text-foreground cursor-pointer transition-colors">Workspaces</span>
            <ChevronRight size={14} />
            <span className="text-sm font-medium text-foreground">Deployments</span>
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">Deployment List</h1>
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-xs font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none">
                {deployments.length} Total
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => dispatch(clearAllDeployments())} className="dark:border-white/10 dark:hover:bg-red-500/10 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
            <Button size="sm" onClick={() => dispatch(fetchDeployments())} disabled={isLoading}>
                <RefreshCcw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Sync State
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-2">
          <div className="relative flex-1 max-w-md">
            <Input 
              placeholder="Filter by ID or workflow name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 focus-visible:ring-primary/20"
            />
            <Filter className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
          </div>
          
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger className="w-[200px] h-10 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Workspaces</SelectItem>
              {workspaces.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border dark:border-white/5 bg-white dark:bg-[#11141D] shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/[0.01]">
                <TableRow className="hover:bg-transparent border-b dark:border-white/5">
                  <TableHead className="w-[400px] py-4 px-6 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Deployment ID / Name</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Status</TableHead>
                  <TableHead className="py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Performance</TableHead>
                  <TableHead className="py-4 text-right px-6 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.map((deployment) => (
                  <TableRow 
                    key={deployment.id} 
                    className="group border-b dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setViewingDeployment(deployment)}
                  >
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border dark:border-white/10">
                           <Terminal size={14} className="text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm flex items-center gap-2">
                            {deployment.metadata?.name || "Unnamed Workflow"}
                            <span className="text-[10px] opacity-40 font-mono">#{deployment.runIndex}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground/60 font-mono mt-0.5 truncate max-w-[200px]">
                            {deployment.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant="secondary" 
                            className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight border-none transition-all",
                                deployment.status === "active" 
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-slate-100 dark:bg-white/5 text-muted-foreground"
                            )}
                        >
                            {deployment.status === "active" ? "Running" : "Stopped"}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col gap-1.5 w-32">
                            <div className="flex justify-between text-[10px] font-medium opacity-60">
                                <span>CPU Usage</span>
                                <span>21%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500/60" style={{ width: '21%' }} />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-xs font-semibold bg-white dark:bg-transparent dark:border-white/10 dark:hover:bg-white/5"
                            onClick={() => {
                                deployment.status === 'active' 
                                ? dispatch(deactivateDeployment(deployment.id)).then(() => dispatch(fetchDeployments()))
                                : dispatch(activateDeployment(deployment.id)).then(() => dispatch(fetchDeployments()))
                            }}
                        >
                            <div className={cn("w-2 h-2 rounded-full mr-2", deployment.status === 'active' ? "bg-red-500" : "bg-white border")} />
                            {deployment.status === 'active' ? "Stop" : "Start"}
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Sheet open={!!viewingDeployment} onOpenChange={(open) => !open && setViewingDeployment(null)}>
        <SheetContent className="w-[500px] sm:w-[600px] bg-white dark:bg-[#0B0E14] border-l dark:border-white/10 p-0 overflow-y-auto">
          {viewingDeployment && (
            <div className="flex flex-col h-full">
              <div className="p-10 border-b dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold tracking-tight">Deployment details</h2>
                    <Button variant="ghost" size="icon" onClick={() => setViewingDeployment(null)} className="h-6 w-6 rounded-full">
                         <ChevronRight size={20} className="rotate-180" />
                    </Button>
                </div>

                <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Deployment ID</span>
                        <div className="flex items-center gap-3">
                            <code className="text-sm font-mono break-all bg-slate-100 dark:bg-white/5 p-2 rounded flex-1">
                                {viewingDeployment.id}
                            </code>
                            <Button variant="ghost" size="icon" className="h-8 w-8 dark:hover:bg-white/5">
                                <Copy size={14} />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Started at</span>
                            <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</span>
                            <Badge className="w-fit bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-none rounded-sm px-1.5 h-5 text-[10px] uppercase font-bold">
                                {viewingDeployment.status === 'active' ? 'Running' : 'Stopped'}
                            </Badge>
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Resource Consumption</h3>
                    <div className="grid gap-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-end text-sm">
                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                    <Cpu size={14} /> CPU
                                </span>
                                <span className="font-mono font-bold">21.10%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: '21%' }} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end text-sm">
                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                    <Activity size={14} /> Memory
                                </span>
                                <span className="font-mono font-bold">5.0 GB / 16 GB</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: '31%' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-3">
                    <p className="text-[11px] leading-relaxed text-blue-600/80 dark:text-blue-400/70">
                        You are currently viewing a live production instance of <span className="font-bold">{viewingDeployment.metadata?.name}</span>. 
                        Adjusting settings may impact active workflow execution.
                    </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}