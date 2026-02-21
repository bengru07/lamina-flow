'use client'

import { useState, useEffect } from "react"
import {
  ChevronDown,
  Info,
  Play,
  Settings,
  Moon,
  Sun,
  Check,
  RefreshCw,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchWorkspace, fetchWorkspaces } from "@/redux/workspaces/WorkspaceThunk"
import { deployWorkflows } from "@/redux/execution/ExecutionThunk"
import { serializeWorkflowForestFromEntries } from "@/lib/utils"
import { metadata } from "@/app/layout"

export default function WorkflowNavigation() {
  const [isDark, setIsDark] = useState(false)

  const dispatch = useAppDispatch()
  const currentWorkspace = useAppSelector(state => state.workspaces.active);
  const activeTabPath = useAppSelector((state) => state.tabs.activeTabPath);
  const workflowData = useAppSelector((state) =>
    activeTabPath ? state.tabs.workflows[activeTabPath] : null
  );
  const workspaces = useAppSelector(state => state.workspaces.list);
  const isReloading = useAppSelector(state => state.workspaces.requests.fetchWorkspace === "pending")

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", isDark)
  }, [isDark]);

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleReload = () => {
    if (currentWorkspace?.uuid) {
      dispatch(fetchWorkspace(currentWorkspace.uuid))
    }
  }

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 font-bold text-foreground hover:text-muted-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">
                {currentWorkspace?.name ?? "Select workspace"}
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
              {workspaces.map(workspace => (
                <DropdownMenuItem
                  key={workspace.uuid}
                  onClick={() => {
                    if (workspace.uuid !== currentWorkspace?.uuid) {
                      dispatch(fetchWorkspace(workspace.uuid))
                    }
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {workspace.description != null && workspace.description != undefined && workspace.description != ""
                        ? workspace.description
                        : "No description"
                      }
                    </span>
                  </div>

                  {workspace.uuid === currentWorkspace?.uuid && (
                    <Check size={14} className="text-emerald-500 shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {currentWorkspace && (
            <button
              onClick={handleReload}
              disabled={isReloading}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={isReloading ? "animate-spin" : ""} />
            </button>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground font-medium">
          {workspaces.length} Workspaces
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsDark(v => !v)}
          className="p-2 hover:bg-accent rounded-lg text-muted-foreground"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="h-6 w-px bg-muted-foreground/30 mx-1" />

        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground" onClick={() => {
          const deployment = serializeWorkflowForestFromEntries(workflowData?.nodes ?? [], workflowData?.edges ?? []);
          const timestamp = new Date().toISOString(); 
          console.log(deployment);

          dispatch(deployWorkflows({
            forest: deployment,
            metadata: {
              name: activeTabPath,
              workspace: currentWorkspace,
              timestamp: timestamp
            }
          }));
        }}>
          <Play size={18} />
        </button>
        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground">
          <Info size={18} />
        </button>
        <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground">
          <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-muted-foreground/30 mx-1" />

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Active
        </div>
      </div>
    </header>
  )
}

