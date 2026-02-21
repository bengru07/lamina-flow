"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Deployment } from "@/redux/execution/ExecutionSlice"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal } from "lucide-react"
import { cn } from "@/lib/utils"
import { activateDeployment, deactivateDeployment, fetchDeployments } from "@/redux/execution/ExecutionThunk"
import { useAppDispatch } from "@/api/appDispatcher"

export const columns: ColumnDef<Deployment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        className="rounded-none border-neutral-400 data-[state=checked]:bg-neutral-800 data-[state=checked]:border-neutral-800 dark:border-neutral-600 dark:data-[state=checked]:bg-neutral-200 dark:data-[state=checked]:border-neutral-200"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="rounded-none border-neutral-400 data-[state=checked]:bg-neutral-800 data-[state=checked]:border-neutral-800 dark:border-neutral-600 dark:data-[state=checked]:bg-neutral-200 dark:data-[state=checked]:border-neutral-200"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "metadata.name",
    header: "Deployment",
    cell: ({ row }) => {
      const name = row.original.metadata?.name || "Unnamed Workflow"
      const id = row.original.id
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-neutral-100 dark:bg-white/5 flex items-center justify-center border border-neutral-200 dark:border-white/10">
            <Terminal size={14} className="text-neutral-500 dark:text-neutral-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase tracking-tight">
              {name}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
              {id}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.status === "active"
      return (
        <Badge 
          variant="secondary" 
          className={cn(
            "rounded-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border-none",
            isActive 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
              : "bg-neutral-100 dark:bg-white/5 text-neutral-400"
          )}
        >
          {isActive ? "Running" : "Stopped"}
        </Badge>
      )
    },
  },
  {
    id: "performance",
    header: "CPU Usage",
    cell: () => (
      <div className="flex flex-col gap-1.5 w-24">
        <div className="h-1 w-full bg-neutral-100 dark:bg-white/5 rounded-none overflow-hidden">
          <div className="h-full bg-neutral-400 dark:bg-neutral-500" style={{ width: '21%' }} />
        </div>
      </div>
    ),
  },
  {
    accessorKey: "metadata.timestamp",
    header: "Timestamp",
    cell: ({ row }) => {
      const dateStr = row.original?.metadata?.timestamp ?? null;
      if (!dateStr) return <span className="text-[10px] text-muted-foreground uppercase font-bold">N/A</span>

      const formattedDate = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr))

      return <span className="text-[10px] font-bold text-muted-foreground uppercase">{formattedDate}</span>
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const dispatch = useAppDispatch();

      const deployment = row.original
      const isActive = deployment.status === "active"

      return (
        <div className="text-right">
          <Button 
            variant="ghost" 
            size="sm" 
            className="z-10 h-7 px-3 rounded-none border border-neutral-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-tighter hover:bg-white dark:hover:bg-white/5"
            onClick={(e) => {
              e.stopPropagation()
              const action = isActive ? deactivateDeployment(deployment.reference_id) : activateDeployment(deployment.reference_id)
              dispatch(action).then(() => dispatch(fetchDeployments()))
            }}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full mr-2", isActive ? "bg-red-500" : "bg-neutral-300 dark:bg-neutral-600")} />
            {isActive ? "Stop" : "Start"}
          </Button>
        </div>
      )
    },
  }
]