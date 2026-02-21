'use client';

import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAppDispatch } from "@/api/appDispatcher"
import { fetchWorkspace, fetchWorkspaces } from "@/redux/workspaces/WorkspaceThunk";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  useEffect(() => {
    dispatch(fetchWorkspaces());

    const segments = pathname.split("/")
    const projectsIdx = segments.indexOf("projects")
    if (projectsIdx !== -1 && segments[projectsIdx + 1]) {
      const urlWorkspaceId = segments[projectsIdx + 1]
      dispatch(fetchWorkspace(urlWorkspaceId))
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col flex-1">
      <main className="flex-1">
        <div className="mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}