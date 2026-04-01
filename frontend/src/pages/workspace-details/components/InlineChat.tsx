import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { Workspace } from "@/types/workspace"
import { ArrowUp, CheckCircle2, ChevronDown, FolderOpen, Loader2, Monitor, Plus, X } from "lucide-react"

interface InlineChatProps {
  prompt: string
  setPrompt: (value: string) => void
  handleSendPrompt: () => void

  selectedContextProjects: Workspace[]
  toggleContextProject: (project: Workspace) => void

  workspaces: Workspace[]
  selectedProvider: any
  setSelectedProvider: (provider: any) => void
  aiStatus: 'idle' | 'pending' | 'succeeded' | 'failed'
}

export default function InlineChat({
  prompt, setPrompt,
  handleSendPrompt,
  selectedContextProjects,
  toggleContextProject,
  workspaces,
  selectedProvider,
  setSelectedProvider,
  aiStatus
}: InlineChatProps) {
  return (
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
        className="w-full min-h-35 p-4 bg-transparent resize-none focus:outline-none text-md"
      />
      
      <div className="px-4 pb-2 flex flex-wrap gap-2">
        {selectedContextProjects.map((project) => (
          <Badge key={project.uuid} variant="secondary" className="pl-2 pr-1 py-1 gap-1 border-primary/20 bg-primary/5 text-primary animate-in zoom-in-95">
            <FolderOpen className="h-3 w-3" />
            <span className="max-w-30 truncate">{project.name}</span>
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
  )
}