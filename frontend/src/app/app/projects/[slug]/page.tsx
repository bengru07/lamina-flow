"use client"

import { useState } from "react"
import WorkflowEditor from "@/components/builder/workflow-editor"
import { WorkflowFileSidebar } from "@/components/builder/workflow-file-sidebar"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { useSidebar } from "@/components/ui/sidebar"
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges"
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

export default function Page() {
  const { open } = useSidebar()
  const { hasUnsavedChanges } = useUnsavedChanges()
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)

  return (
    <div className="h-screen w-full overflow-hidden bg-background">
      <ResizablePanelGroup
        key={open ? "sidebar-open" : "sidebar-closed"}
        direction="horizontal"
        className="h-full w-full"
      >
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={40}
          className="bg-background"
        >
          <WorkflowFileSidebar />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={80}>
          <main className="relative w-full h-[calc(100vh-4rem)]">
            <WorkflowEditor />
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your workflow. Switching workspaces will discard these changes. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUrl(null)}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setShowExitDialog(false);
                if (pendingUrl) window.location.href = pendingUrl;
              }}
            >
              Discard & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}