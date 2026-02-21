import { Zap, FilePlus, Search, CommandIcon } from "lucide-react";
import { Button } from "../ui/button";

export function NoWorkflowSelected() {
  const Kbd = ({ children }: { children: React.ReactNode }) => (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground/80 opacity-100 dark:bg-zinc-900 dark:text-zinc-400">
      {children}
    </kbd>
  );

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background transition-colors duration-300 pt-16">
      <div className="flex flex-col items-center text-center max-w-[420px] px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="mb-8 rounded-full bg-primary/10 dark:bg-primary/5 p-6 text-primary/50 dark:text-primary/30 ring-1 ring-primary/20">
          <Zap size={40} strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-zinc-200">
          Workflow Editor
        </h1>
        <p className="mt-3 text-sm text-muted-foreground dark:text-zinc-500 leading-relaxed">
          Your workspace is active and ready. Select an existing automation from the explorer or create a new logic flow to begin.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-2 w-full">
          <div className="flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted dark:bg-zinc-800 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <FilePlus size={18} />
              </div>
              <span className="text-sm font-medium text-foreground/80 dark:text-zinc-300">New Workflow File</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>N</Kbd>
            </div>
          </div>

          <div className="flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted dark:bg-zinc-800 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <Search size={18} />
              </div>
              <span className="text-sm font-medium text-foreground/80 dark:text-zinc-300">Quick Open</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>P</Kbd>
            </div>
          </div>

          <div className="flex items-center justify-between group p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted dark:bg-zinc-800 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all">
                <CommandIcon size={18} />
              </div>
              <span className="text-sm font-medium text-foreground/80 dark:text-zinc-300">All Commands</span>
            </div>
            <div className="flex items-center gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>⇧</Kbd>
              <Kbd>P</Kbd>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 w-full justify-center">
            <div className="h-[1px] flex-1 max-w-[60px] bg-border/60 dark:bg-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 dark:text-zinc-600">
                Resources
            </span>
            <div className="h-[1px] flex-1 max-w-[60px] bg-border/60 dark:bg-zinc-800" />
        </div>

        <div className="mt-6 flex gap-1">
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-primary hover:bg-primary/5 dark:text-zinc-500">
                Keyboard Shortcuts
            </Button>
            <div className="w-[1px] h-3 bg-border self-center" />
            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground hover:text-primary hover:bg-primary/5 dark:text-zinc-500">
                Documentation
            </Button>
        </div>
      </div>
    </div>
  );
}