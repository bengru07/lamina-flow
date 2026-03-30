import PageLayout from "@/layout/page";
import WorkspaceList from "./components/workspace-list";

export default function Page() {
  return (
    <PageLayout
      title="Workspaces"
      description="Manage your workspaces here."
    >
      <WorkspaceList workspaces={[
        {
          id: "1",
          name: "Workspace 1",
          description: "First workspace",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          tags: ["tag1", "tag2"]
        },
        {
          id: "2",
          name: "Workspace 2",
          description: "Second workspace",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          tags: ["tag3", "tag4"]
        },
        {
          id: "3",
          name: "Workspace 3",
          description: "Third workspace",
          createdAt: "2023-01-01T00:00:00Z",
          updatedAt: "2023-01-01T00:00:00Z",
          tags: ["tag5", "tag6"]
        }
      ]} />
    </PageLayout>
  );
}