import React from "react";
import {
  Layers,
  Search,
  Plus,
  FileUp,
  Zap,
  LayoutGrid,
  Globe,
  Database,
  GitBranch,
  ArrowRightLeft,
  Repeat,
  Split,
  Cpu,
  MessageSquare,
} from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function WorkflowMainSidebar() {
  return (
    <div className="h-screen min-w-[250px] bg-background overflow-hidden flex flex-col">
      <WorkflowSidebar />
    </div>
  );
}

function WorkflowSidebar() {
  return (
    <aside className="h-full bg-background flex flex-col shrink-0">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-tight text-foreground">
            Node Library
          </h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Layers size={14} />
          </button>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-2.5 text-muted-foreground"
            size={14}
          />
          <input
            type="text"
            placeholder="Search node..."
            className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-input rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
        </div>

        <button className="w-full bg-primary-600 hover:bg-primary-500 dark:bg-primary-500 dark:hover:bg-primary-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold shadow-sm transition-all active:scale-[0.98]">
          <Plus size={16} /> Create Node
        </button>

        <button className="w-full border border-input bg-background py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all">
          <FileUp size={16} /> Import
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <NodeCategory
          title="Input"
          nodes={[
            { icon: <Zap />, label: "Start" },
            { icon: <LayoutGrid />, label: "Form Input" },
            { icon: <Globe />, label: "Webhook" },
            { icon: <Database />, label: "DB Query" },
          ]}
        />
        <NodeCategory
          title="Logic"
          nodes={[
            { icon: <GitBranch />, label: "If/Else" },
            { icon: <ArrowRightLeft />, label: "Switch" },
            { icon: <Repeat />, label: "Loop" },
            { icon: <Split />, label: "Merge" },
          ]}
        />
        <NodeCategory
          title="AI / Prompt"
          nodes={[
            { icon: <Cpu />, label: "LLM Prompt" },
            { icon: <MessageSquare />, label: "Analysis" },
          ]}
        />
      </div>
    </aside>
  );
}

function NodeCategory({
  title,
  nodes,
}: {
  title: string;
  nodes: { icon: React.ReactNode; label: string }[];
}) {
  return (
    <section>
      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {nodes.map((node, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 border border-border rounded-lg hover:border-primary-500/50 hover:bg-primary-500/5 dark:hover:bg-primary-500/10 cursor-grab transition-all group bg-card shadow-sm"
          >
            <div className="p-1.5 bg-secondary text-muted-foreground rounded-md group-hover:text-primary-500 group-hover:bg-primary-500/10 dark:group-hover:bg-primary-500/20 transition-colors">
              {React.cloneElement(node.icon as React.ReactElement, { size: 14 })}
            </div>
            <span className="text-[10px] font-semibold text-foreground/80 group-hover:text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {node.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}