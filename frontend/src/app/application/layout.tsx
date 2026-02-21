'use client';

import BuilderNavigation from "@/components/builder/builder-navigation";
import { sidebarConfig } from "@/lib/data";
import WorkflowNavigation from "@/components/builder/workflow-navigation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ReactFlowProvider } from "@xyflow/react";
import WorkflowEditor from "@/components/builder/workflow-editor";
import WorkflowPropertiesSidebar from "@/components/builder/workflow-properties";
import { Provider } from "react-redux";
import { store } from "@/redux/store";

export default function WorkflowEditorWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <div className="flex h-screen w-screen bg-[#F1F3F5] text-[#333] font-sans overflow-hidden">
        <BuilderNavigation mainItems={sidebarConfig.main} footerItems={sidebarConfig.footer} />

        <div className="flex flex-col flex-1 overflow-hidden">
          <WorkflowNavigation />
          {children}
        </div>
      </div>
    </Provider>
  );
}