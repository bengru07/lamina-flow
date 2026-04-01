import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Workspace } from '@/types/workspace'
import WorkspaceCards from './workspace-cards'
import WorkspaceListHeader, { type ViewVariant } from './workspace-list-header'
import WorkspaceTable from './workspace-table'
import { Spinner } from '@/components/ui/spinner'
import StatusBanner from '@/components/common/StatusBanner'

const VALID_VIEWS: ViewVariant[] = ['card', 'table']
const VIEW_PARAM = 'view'
const TAGS_PARAM = 'tags'

interface WorkspaceListProps {
  workspaces: Workspace[]
  onNewWorkspace?: () => void
  loading?: boolean
  error?: string
}

export default function WorkspaceList({ workspaces, onNewWorkspace, loading, error }: WorkspaceListProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState('')

  const view: ViewVariant = VALID_VIEWS.includes(searchParams.get(VIEW_PARAM) as ViewVariant)
    ? (searchParams.get(VIEW_PARAM) as ViewVariant)
    : 'card'

  const activeTags: string[] = React.useMemo(() => {
    const raw = searchParams.get(TAGS_PARAM)
    return raw ? raw.split(',').filter(Boolean) : []
  }, [searchParams])

  const setView = React.useCallback((next: ViewVariant) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set(VIEW_PARAM, next)
      return p
    }, { replace: true })
  }, [setSearchParams])

  const setActiveTags = React.useCallback((tags: string[]) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      if (tags.length === 0) {
        p.delete(TAGS_PARAM)
      } else {
        p.set(TAGS_PARAM, tags.join(','))
      }
      return p
    }, { replace: true })
  }, [setSearchParams])

  const filtered = React.useMemo(() => {
    let result = workspaces

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description?.toLowerCase().includes(q),
      )
    }

    if (activeTags.length > 0) {
      result = result.filter((w) =>
        activeTags.every((tag) => w.tags?.includes(tag)),
      )
    }

    return result
  }, [workspaces, searchQuery, activeTags])

  return (
    <div className="w-full flex flex-col gap-4">
      <WorkspaceListHeader
        workspaces={workspaces}
        view={view}
        onViewChange={setView}
        onSearchChange={setSearchQuery}
        onTagFilterChange={setActiveTags}
        activeTags={activeTags}
        onAction={onNewWorkspace}
      />
      {loading ? (
        <div className="w-full py-20 flex items-center justify-center">
          <Spinner />
        </div>
      ) : null}
      {!loading && (view === 'card'
        ? <WorkspaceCards workspaces={filtered} />
        : <WorkspaceTable workspaces={filtered} />)
      }

      {error ? (
        <StatusBanner type="error" message={error} />
      ) : null}
    </div>
  )
}