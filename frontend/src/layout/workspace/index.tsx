import { WorkspaceSidebar } from "@/layout/workspace/sidebar";
import { Outlet } from "react-router-dom";

export function WorkspaceLayout() {
  return (
    <div className="flex w-full h-full overflow-hidden">
      <WorkspaceSidebar />
      <main className="flex-1 h-full overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}