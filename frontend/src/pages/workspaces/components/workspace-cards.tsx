import { useNavigate } from 'react-router-dom'
import type { Workspace } from '@/types/workspace'
import { WorkspaceCard, WorkspaceEmptyCard } from './workspace-card'

interface WorkspaceCardsProps {
  workspaces: Workspace[]
  onNewWorkspace?: () => void
}

export default function WorkspaceCards({ workspaces, onNewWorkspace }: WorkspaceCardsProps) {
  const navigate = useNavigate()

  return (
    <div className="w-full flex flex-wrap gap-4">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          onClick={(w) => navigate(`/workspaces/${w.id}`)}
          actions={[
            {
              label: 'Copy workspace ID',
              onClick: () => navigator.clipboard.writeText(workspace.id),
            },
            {
              label: 'Settings',
              onClick: () => navigate(`/workspaces/${workspace.id}/settings`),
            },
            {
              label: 'Delete',
              danger: true,
              onClick: () => console.warn('delete', workspace.id),
            },
          ]}
        />
      ))}

      {(workspaces.length === 0 || onNewWorkspace) && (
        <WorkspaceEmptyCard
          label="New workspace"
          description="Create a new workspace"
          onClick={onNewWorkspace}
        />
      )}
    </div>
  )
}