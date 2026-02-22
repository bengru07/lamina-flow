'use client';

import React, { useState, useEffect } from "react";
import {
  Search,
  Home,
  FolderOpen,
  LayoutGrid,
  FileCode,
  ChevronRight,
  Plus,
  ChevronDown,
  Settings,
  HelpCircle,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAppSelector, useAppDispatch } from "@/api/appDispatcher";
import { closeAllTabs } from "@/redux/workflow/tabsSlice";

const mainNav = [
  { title: "Search", icon: Search, path: "/app/search" },
  { title: "Home", icon: Home, path: "/app" },
  { title: "Deployments", icon: LayoutGrid, path: "/app/deployments" },
  { title: "Templates", icon: FileCode, path: "/app/templates" },
]

export function AppSidebar() {
  const path = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const workspaces = useAppSelector((state) => state.workspaces.list);
  const openTabs = useAppSelector((state) => state.tabs.openTabs);
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const hasUnsavedChanges = openTabs.some(tab => tab.isDirty);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.active?.uuid);
  const hasWorkspaces = workspaces && workspaces.length > 0;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleWorkspaceClick = (e: React.MouseEvent, targetPath: string, clickedWorkspaceId: string) => {
    const isSwitchingProject = activeWorkspaceId !== null && activeWorkspaceId !== clickedWorkspaceId;

    if (hasUnsavedChanges && isSwitchingProject) {
      e.preventDefault();
      setPendingUrl(targetPath);
      setShowExitDialog(true);
    }
    else if (isSwitchingProject) {
      dispatch(closeAllTabs());
    }
  };

  const confirmNavigation = () => {
    if (pendingUrl) {
      router.push(pendingUrl);
      dispatch(closeAllTabs());
    }

    setShowExitDialog(false);
    setPendingUrl(null);
  };

  return (
    <>
      <Sidebar variant="sidebar" className="border-r">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-background rounded-full" />
                </div>
                <span className="font-semibold text-sm">Lamina/Flow</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase">Free</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 mt-4 h-9 font-normal border-dashed">
            <Plus className="h-4 w-4" />
            <span>New Node</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={path === item.path}
                      className={path === item.path ? "bg-accent text-accent-foreground" : ""}
                    >
                      <Link href={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                <Collapsible asChild defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    {hasWorkspaces ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={path.startsWith("/app/projects")}>
                            <FolderOpen className="h-4 w-4" />
                            <span>Projects</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {workspaces.map((workspace: any) => (
                              <SidebarMenuSubItem key={workspace.uuid}>
                                <SidebarMenuSubButton 
                                  asChild 
                                  isActive={path === `/app/projects/${workspace.uuid}`}
                                >
                                  <Link 
                                    href={`/app/projects/${workspace.uuid}`} 
                                    onClick={(e) => handleWorkspaceClick(e, `/app/projects/${workspace.uuid}`, workspace.uuid)}
                                  >
                                    <span>{workspace.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : (
                      <SidebarMenuButton asChild isActive={path === "/app/projects"}>
                        <Link href="/app/projects">
                          <FolderOpen className="h-4 w-4" />
                          <span>Projects</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors group">
              Favorites <ChevronRight className="h-3.5 w-3.5" />
            </SidebarGroupLabel>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors group">
              Recents <ChevronDown className="h-3.5 w-3.5" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-8">
                    <div className="w-4 h-4 border border-dashed rounded-full border-muted-foreground/50 shrink-0" />
                    <span className="truncate">Item 1</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-8">
                    <div className="w-4 h-4 border border-dashed rounded-full border-muted-foreground/50 shrink-0" />
                    <span className="truncate">Item 2</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="gap-3">
                <Link href="/app/settings">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="gap-3">
                <HelpCircle className="h-4 w-4" />
                <span>Support</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Unsaved Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your current 
              project <span className="font-semibold text-slate-100">{workspaces.find(w => w.uuid === activeWorkspaceId)?.name}</span>.
              Switching projects will close all open tabs and discard any unsaved work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUrl(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmNavigation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}