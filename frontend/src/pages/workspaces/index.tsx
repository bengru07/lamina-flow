import PageLayout from "@/layout/page";
import WorkspaceList from "./components/workspace-list";
import type { RootState } from "@/store/store";
import { useAppSelector } from "@/store/app-dispatcher";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Page() {
  const workspaces = useAppSelector((state: RootState) => state.workspaces.workspaces);
  const status = useAppSelector((state: RootState) => state.workspaces.status);
  const error = useAppSelector((state: RootState) => state.workspaces.error);

  const navigate = useNavigate();

  return (
    <PageLayout
      title="Workspaces"
      description="Manage your workspaces here."
      headerActions={
        <>
          <Button variant="outline" onClick={() => navigate('/workspaces/create')}>
            <Plus /> New Workspace
          </Button>
        </>
      }
    >
      <WorkspaceList workspaces={workspaces} loading={status === 'loading'} error={status === 'failed' ? error : undefined} />
    </PageLayout>
  );
}