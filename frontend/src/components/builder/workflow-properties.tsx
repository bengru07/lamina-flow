import React, { useEffect, useState, useMemo } from "react";
import { ChevronDown, Settings, Save, Loader2, Trash2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { updateWorkspace } from "@/redux/workspaces/WorkspaceThunk";
import { WorkspaceDeleteDialog } from "./dialog/workspace-delete-dialog";

export default function WorkflowPropertiesSidebar() {
  const dispatch = useAppDispatch();

  const workspace = useAppSelector((state) => state.workspaces.active);
  const requests = useAppSelector((state) => state.workspaces.requests);

  const isUpdating = requests.updateWorkspace === "pending";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (workspace) {
      setName(workspace.name ?? "");
      setDescription(workspace.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [workspace]);

  const isDirty = useMemo(() => {
    if (!workspace) return false;
    return (
      name !== (workspace.name ?? "") ||
      description !== (workspace.description ?? "")
    );
  }, [name, description, workspace]);

  const onSave = () => {
    if (!workspace || !isDirty || isUpdating) return;

    dispatch(
      updateWorkspace({
        workspaceId: workspace.uuid,
        data: { name, description },
      })
    );
  };

  return (
    <aside className="w-full h-full flex flex-col bg-background">
      {!workspace ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          No workspace selected
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-foreground">Info</h3>
                <ChevronDown size={14} className="text-muted-foreground" />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">
                    Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-xs dark:text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase font-bold text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 bg-secondary/50 border rounded-lg text-xs h-20 resize-none dark:text-muted-foreground"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-foreground">
                  Runtime Settings
                </h3>
                <ChevronDown size={14} className="text-muted-foreground" />
              </div>

              <div className="text-[10px] space-y-2">
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Timeout (ms)</span>
                  <span className="font-bold">3000</span>
                </div>
                <div className="flex justify-between border-b py-1">
                  <span className="text-muted-foreground">Retry attempts</span>
                  <span className="font-bold">2</span>
                </div>
              </div>
            </section>
          </div>

          <div className="p-4 border-t space-y-2 bg-secondary/20">
            <button
              onClick={onSave}
              disabled={!isDirty || isUpdating}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>

            <WorkspaceDeleteDialog workspaceId={workspace.uuid}>
              <button className="w-full flex items-center justify-center gap-2 border border-destructive text-destructive py-2 rounded-xl text-xs font-bold hover:bg-muted-foreground/10">
                <Trash2 size={14} />
                Delete Workspace
              </button>
            </WorkspaceDeleteDialog>
          </div>
        </>
      )}
    </aside>
  );
}
