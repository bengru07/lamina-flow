import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Workflow, Key, Users, Settings,
  BookOpen, Zap, Activity,
  DockIcon,
  Rocket,
} from 'lucide-react'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
  end?: boolean
}

interface NavGroup {
  heading?: string
  items: NavItem[]
}

function buildNavGroups(workspaceSlug: string): NavGroup[] {
  const base = `/workspaces/${workspaceSlug}`
  return [
    {
      items: [
        { icon: <LayoutDashboard size={15} />, label: 'Overview', path: base, end: true },
        { icon: <Workflow size={15} />, label: 'Workflows', path: `${base}/workflows` },
        { icon: <DockIcon size={15} />, label: 'Manifests', path: `${base}/manifests`},
        { icon: <Rocket size={15} />, label: 'Deployments', path: `${base}/deployments` },
        { icon: <Activity size={15} />, label: 'Logs', path: `${base}/logs` },
        { icon: <Zap size={15} />, label: 'Triggers', path: `${base}/triggers` },
      ],
    },
    {
      heading: 'Project',
      items: [
        { icon: <Key size={15} />, label: 'API Keys', path: `${base}/api-keys` },
        { icon: <Users size={15} />, label: 'Team', path: `${base}/team` },
        { icon: <BookOpen size={15} />, label: 'Docs', path: `${base}/docs` },
        { icon: <Settings size={15} />, label: 'Settings', path: `${base}/settings` },
      ],
    },
  ]
}

interface SidebarItemProps {
  item: NavItem
  expanded: boolean
  active: boolean
  onClick: () => void
}

function SidebarItem({ item, expanded, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-150',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span
        className={cn(
          'text-[13px] font-medium whitespace-nowrap overflow-hidden transition-all duration-200',
          expanded ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0',
        )}
      >
        {item.label}
      </span>
    </button>
  )
}

interface WorkspaceSidebarProps {
  workspaceName?: string
}

export function WorkspaceSidebar({ workspaceName }: WorkspaceSidebarProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState(false)

  if (!workspaceId) return null

  const groups = buildNavGroups(workspaceId)

  const isActive = (item: NavItem) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'relative flex flex-col h-full bg-background border-r border-border shrink-0 transition-all duration-200 ease-in-out overflow-hidden',
        expanded ? 'w-52' : 'w-13',
      )}
    >
      <div className={cn(
        'flex items-center gap-2.5 px-3 py-4 border-b border-border min-h-13.25 overflow-hidden',
      )}>
        <div className="w-6 h-6 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            {(workspaceName ?? 'W')[0]}
          </span>
        </div>
        <span
          className={cn(
            'text-[13px] font-medium text-foreground whitespace-nowrap overflow-hidden transition-all duration-200',
            expanded ? 'opacity-100 max-w-35' : 'opacity-0 max-w-0',
          )}
        >
          {workspaceName ?? 'Workspace'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-5">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <p
                className={cn(
                  'text-[10px] uppercase tracking-wider font-medium text-muted-foreground/60 px-3 mb-1 whitespace-nowrap overflow-hidden transition-all duration-200',
                  expanded ? 'opacity-100' : 'opacity-0',
                )}
              >
                {group.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <SidebarItem
                  key={item.path}
                  item={item}
                  expanded={expanded}
                  active={isActive(item)}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn(
        'px-3 py-3 border-t border-border flex items-center justify-end transition-opacity duration-200',
        expanded ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}>
        
      </div>
    </aside>
  )
}