import { useAppDispatch, useAppSelector } from "@/api/appDispatcher";
import { Button } from "./ui/button";
import { DynamicBreadcrumbs } from "./ui/dynamic-breadcrumb";
import { ModeToggle } from "./ui/mode-toggle";
import { SidebarTrigger } from "./ui/sidebar";
import { Spinner } from "./ui/spinner";
import { deployWorkflows } from "@/redux/execution/ExecutionThunk";
import { serializeWorkflowForestFromEntries } from "@/lib/utils";

export default function AppNavbar() {
  const dispatch = useAppDispatch();
  const activeTabPath = useAppSelector((state) => state.tabs.activeTabPath);
  const status_deploying = useAppSelector((state) => state.execution.requests.deploy);
  const currentWorkspace = useAppSelector(state => state.workspaces.active);
  const workflowData = useAppSelector((state) =>
    activeTabPath ? state.tabs.workflows[activeTabPath] : null
  );
  
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b sticky top-0 bg-background z-20">
      <div className="flex items-center gap-2 space-4">
        <SidebarTrigger />
        <DynamicBreadcrumbs baseRoute="/app" />
      </div>
      <div className="flex items-center gap-2">
        {
          activeTabPath && activeTabPath.length > 0 && 
          <Button disabled={status_deploying == "pending"} variant="outline" size="sm" onClick={() => {
            const deployment = serializeWorkflowForestFromEntries(workflowData?.nodes ?? [], workflowData?.edges ?? []);
            const timestamp = new Date().toISOString(); 
            console.log(deployment);
  
            dispatch(deployWorkflows({
              forest: deployment,
              metadata: {
                name: activeTabPath,
                workspace: currentWorkspace,
                timestamp: timestamp
              }
            }));
          }}>
            {status_deploying == "pending" ? <>
              <Spinner className="animate-spin h-4 w-4 mr-2" />
            </> : "Deploy"}
          </Button>
        }
        <Button variant="ghost" size="sm">Feedback</Button>
        <ModeToggle />
        <div className="flex items-center gap-1 px-2 py-1 border rounded-full bg-muted/50">
          <div className="w-4 h-4 bg-primary rounded-full" />
          <span className="text-xs font-medium">5.00</span>
        </div>
      </div>
    </header>
  )
}