"use client"

import { useEffect, useState } from "react"
import { 
  ChevronRight, 
  Play, 
  Square, 
  Loader2, 
  Trash2, 
  Zap, 
  Activity,
  Box,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchDeployments, activateDeployment, clearAllDeployments } from "@/redux/execution/ExecutionThunk"
import { cn } from "@/lib/utils"

export default function DeploymentDetailsPage() {
  const dispatch = useAppDispatch()
  const { deployments, requests } = useAppSelector((state) => state.execution)
  
  // Track running state locally for immediate UI feedback
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    dispatch(fetchDeployments())
  }, [dispatch])

  const handleToggleDeployment = async (id: string) => {
    if (runningIds.has(id)) {
      // In a real scenario, you'd call a stopDeployment thunk here
      setRunningIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      setRunningIds(prev => new Set(prev).add(id))
      await dispatch(activateDeployment(id))
    }
  }

  const isLoading = requests.fetchDeployments === "pending"

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span className="text-muted-foreground">Projects</span>
          <ChevronRight className="h-6 w-6 text-muted-foreground/50" />
          <span>Deployments</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => dispatch(clearAllDeployments())}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
          <Button size="sm" variant="secondary" onClick={() => dispatch(fetchDeployments())}>
            {requests.fetchDeployments === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading && deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Fetching active deployments...</p>
          </div>
        ) : deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
            <Box className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <h3 className="font-medium">No deployments found</h3>
            <p className="text-sm text-muted-foreground">Deploy a workflow from the editor to see it here.</p>
          </div>
        ) : (
          deployments.map((deployment: any, index) => {
            const depId = deployment.reference_id;
            const isRunning = runningIds.has(depId);
            const name = deployment.metadata?.name || `Deployment #${index + 1}`;

            return (
              <Card key={depId} className={cn(
                "group transition-all duration-300 border-muted/60 shadow-sm overflow-hidden",
                isRunning && "ring-1 ring-primary/50 border-primary/50 shadow-md"
              )}>
                <CardContent className="p-0">
                  <div className="flex items-center p-4 gap-6">
                    {/* Status Indicator */}
                    <div className="relative flex items-center justify-center">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                        isRunning ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        <Zap size={20} className={isRunning ? "fill-primary" : ""} />
                      </div>
                      {isRunning && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{name}</h3>
                        <Badge variant={isRunning ? "default" : "secondary"} className="text-[10px] h-4">
                          {isRunning ? "RUNNING" : "IDLE"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono">
                          ID: {depId.slice(0, 8)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {deployment.metadata?.timestamp || "Just now"}
                        </span>
                        <span className="flex items-center gap-1">
                          Nodes: {deployment.forest?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-2">
                      <Button
                        variant={isRunning ? "destructive" : "default"}
                        size="sm"
                        className={cn(
                          "w-24 gap-2 transition-all",
                          !isRunning && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        onClick={() => handleToggleDeployment(depId)}
                        disabled={requests.activate === "pending"}
                      >
                        {isRunning ? (
                          <>
                            <Square className="h-3.5 w-3.5 fill-current" /> Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" /> Start
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </main>
  )
}