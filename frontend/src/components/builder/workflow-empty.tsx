import { useState, useMemo, useEffect } from "react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import {
  Plus,
  MousePointer2,
  Workflow,
  ArrowUpRight,
  BookOpen,
  Zap,
  CommandIcon,
  FilePlus,
  Search,
} from "lucide-react"
import { WorkspaceCreateDialog } from "./dialog/workspace-create-dialog"
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher"
import { fetchWorkspace, fetchWorkspaces } from "@/redux/workspaces/WorkspaceThunk"

export default function NoWorkspaceSelected() {
  const [commandOpen, setCommandOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState("")

  const dispatch = useAppDispatch();
  const workspaces = useAppSelector((state) => state.workspaces.list);
  const load_workspaces = useAppSelector((state) => state.workspaces.requests.fetchWorkspaces);

  const filteredWorkspaces = useMemo(() => {
    if (!query) return workspaces
    return workspaces.filter(w =>
      `${w.name} ${w.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
  }, [query, workspaces]);

  return (
    <>
      <div className="flex h-full w-full items-center justify-center bg-muted/30 dark:bg-black/70">
        <Empty className="max-w-105 bg-card p-10 rounded-2xl border border-solid border-border shadow-sm">
          <EmptyHeader>
            <EmptyMedia className="bg-primary-500/10 text-primary-500 rounded-2xl p-4 mb-4">
              <Workflow size={40} strokeWidth={1.5} />
            </EmptyMedia>

            <EmptyTitle className="text-xl font-bold tracking-tight text-foreground">
              No Workspace Selected
            </EmptyTitle>

            <EmptyDescription className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Select a workspace to start editing workflows, or create a new one
              to organize your automations.
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent className="mt-8">
            <div className="flex flex-col sm:flex-row gap-3 w-full flex-wrap">
              <Button
                onClick={() => setCreateOpen(true)}
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-900/20"
              >
                <Plus className="mr-1 h-4 w-4" />
                New Workspace
              </Button>

              <Button
                variant="outline"
                className="flex-1 text-foreground hover:text-muted-foreground"
                onClick={() => setCommandOpen(true)}
              >
                <MousePointer2 className="mr-2 h-4 w-4" />
                Select Workspace
              </Button>
            </div>
          </EmptyContent>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
            <Button
              variant="link"
              asChild
              className="text-muted-foreground text-xs p-0 h-auto hover:text-primary-500"
            >
              <a href="#" className="flex items-center gap-1">
                <BookOpen size={14} />
                Documentation
              </a>
            </Button>

            <Button
              variant="link"
              asChild
              className="text-muted-foreground text-xs p-0 h-auto hover:text-foreground"
            >
              <a href="#" className="flex items-center gap-1">
                Video Tutorial
                <ArrowUpRight size={14} />
              </a>
            </Button>
          </div>
        </Empty>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search workspaces..."
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            <CommandGroup heading={filteredWorkspaces.length ? "Workspaces" : ""}>
              {
                load_workspaces !== "fulfilled" ? (
                  <CommandItem className="text-center text-sm text-muted-foreground py-2">
                    Loading workspaces...
                  </CommandItem>
                ) : null
              }
              {load_workspaces === "fulfilled" && filteredWorkspaces.map(workspace => (
                <CommandItem
                  key={workspace.uuid}
                  value={workspace.uuid}
                  onSelect={() => {
                    dispatch(fetchWorkspace(workspace.uuid));
                    setCommandOpen(false);
                  }}

                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="font-medium">{workspace.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {workspace.description}
                  </span>
                </CommandItem>
              ))}

              {load_workspaces === "fulfilled" && filteredWorkspaces.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  No workspaces found
                </div>
              )}
            </CommandGroup>
          </CommandList>

          <CommandGroup className="border-t">
            <CommandItem
              onSelect={() => {
                setCommandOpen(false)
                requestAnimationFrame(() => setCreateOpen(true))
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Workspace
            </CommandItem>
          </CommandGroup>
        </Command>
      </CommandDialog>

      <WorkspaceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </>
  )
}