import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { deleteWorkspace } from "@/redux/workspaces/WorkspaceThunk";
import React from "react";

export function ProjectDeleteDialog({
  workspaceId,
  children,
  deleteCallback,
}: {
  workspaceId: string;
  children: React.ReactNode;
  deleteCallback?: (e: React.FormEvent) => void;
}) {
  const dispatch = useAppDispatch();
  const isDeleting = useAppSelector(
    (state) => state.workspaces.requests.deleteWorkspace === "pending"
  );

  const onConfirmDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteCallback) {
      deleteCallback(e);
    } else {
      dispatch(deleteWorkspace(workspaceId));
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <form onSubmit={onConfirmDelete}>
          <DialogHeader>
            <DialogTitle>Delete Project(s)</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All data associated
              will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>

            <Button
              type="submit"
              variant="destructive"
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete Workspace"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
