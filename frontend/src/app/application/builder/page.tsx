'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ReactFlowProvider } from "@xyflow/react";
import WorkflowEditor from "@/components/builder/workflow-editor";
import WorkflowPropertiesSidebar from "@/components/builder/workflow-properties";
import { WorkflowFileSidebar } from "@/components/builder/workflow-file-sidebar";

export default function WorkflowLayout() {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Top Navbar stays outside the resizable group */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          
          {/* 1. Left Sidebar: Node Library */}
          <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
            <WorkflowFileSidebar />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 2. Main Content: App Workspace */}
          <ResizablePanel defaultSize={60}>
            <main className="w-full h-full">
              <ReactFlowProvider>
                <WorkflowEditor />
              </ReactFlowProvider>
            </main>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* 3. Right Sidebar: Properties */}
          <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
            <WorkflowPropertiesSidebar />
          </ResizablePanel>
          
        </ResizablePanelGroup>
      </div>
    </div>
  )
}