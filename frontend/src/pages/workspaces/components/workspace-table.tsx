import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/ui/data-table'
import { getWorkspaceColumns } from './columns'
import type { Workspace } from '@/types/workspace'

interface WorkspaceTableProps {
  workspaces: Workspace[]
}

export default function WorkspaceTable({ workspaces }: WorkspaceTableProps) {
  const navigate = useNavigate()

  const columns = getWorkspaceColumns({
    onOpen: (w) => navigate(`/workspaces/${w.id}`),
    onSettings: (w) => navigate(`/workspaces/${w.id}/settings`),
    onDelete: (w) => console.warn('delete', w.id),
  })

  return <DataTable columns={columns} data={workspaces} />
}