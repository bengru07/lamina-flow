import * as React from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, LayoutDashboard, Boxes, FileText, Rocket, Settings, Workflow, Box } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAppDispatch } from '@/store/app-dispatcher'
import { setCurrentWorkspaceById } from '@/store/workspaces/workspace-slice'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { thunkGetAllWorkspaces } from '@/store/workspaces/workspace-thunk'

interface ResolvedCrumb {
  label: React.ReactNode
  href?: string
  isLast: boolean
}

function SegmentLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="flex items-center [&_svg]:size-3.5 opacity-60">{icon}</span>
      {text}
    </span>
  )
}

function WorkspaceLabel({ workspaceId, href }: { workspaceId: string; href: string }) {
  const navigate = useNavigate()
  const workspace = useSelector((state: RootState) => state.workspaces.currentWorkspace);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1 px-1 py-0.5 rounded text-sm',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors duration-150 outline-none',
          )}
        >
          <Box className="size-3.5 opacity-60 shrink-0 -ml-1 mr-0.5" />
          <span className="max-w-40 truncate">{workspace?.name}</span>
          <ChevronRight className="size-3 opacity-40 rotate-90 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuItem onClick={() => navigate(href)}>
          Open workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`${href}/settings`)}>
          Workspace settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function useResolvedCrumbs(): ResolvedCrumb[] {
  const location = useLocation()
  const params = useParams()
  const dispatch = useAppDispatch();
  const segments = location.pathname.split('/').filter(Boolean)
  const workspaces = useSelector((state: RootState) => state.workspaces.workspaces);

  React.useEffect(() => {
    dispatch(thunkGetAllWorkspaces())
  }, [dispatch]);

  React.useEffect(() => {
    const identifier = params.workspaceId || segments[1]

    if (identifier) {
      dispatch(setCurrentWorkspaceById(identifier))
    }
  }, [dispatch, location.pathname, params, params.workspaceId, segments, workspaces])

  if (segments.length === 0) {
    return [
      { label: <SegmentLabel icon={<LayoutDashboard />} text="Home" />, isLast: true },
    ]
  }

  const crumbs: ResolvedCrumb[] = [
    {
      label: <SegmentLabel icon={<LayoutDashboard />} text="Home" />,
      href: '/',
      isLast: false,
    },
  ]

  const [first, second, third] = segments

  if (first === 'workspaces') {
    const isCreate = second === 'create'
    const onDetail = !!second && !isCreate
    const onSettings = second && third === 'settings'
    const onWorkflows = second && third === 'workflows'

    crumbs.push({
      label: <SegmentLabel icon={<Boxes />} text="Workspaces" />,
      href: '/workspaces',
      isLast: !onDetail && !isCreate,
    })

    if (isCreate) {
      crumbs.push({
        label: <SegmentLabel icon={<Boxes />} text="New Workspace" />,
        isLast: true,
      })
    }

    if (onDetail) {
      crumbs.push({
        label: (
          <WorkspaceLabel
            workspaceId={params.workspaceId ?? second}
            href={`/workspaces/${second}`}
          />
        ),
        href: onSettings || onWorkflows ? `/workspaces/${second}` : undefined,
        isLast: !onSettings && !onWorkflows,
      })

      if (onSettings) {
        crumbs.push({
          label: <SegmentLabel icon={<Settings />} text="Settings" />,
          isLast: true,
        })
      }

      if (onWorkflows) {
        crumbs.push({
          label: <SegmentLabel icon={<Workflow />} text="Workflows" />,
          isLast: true,
        })
      }
    }
  } else if (first === 'manifests') {
    crumbs.push({
      label: <SegmentLabel icon={<FileText />} text="Manifests" />,
      href: '/manifests',
      isLast: !second,
    })

    if (second) {
      crumbs.push({
        label: (
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5 opacity-60 shrink-0" />
            <span className="max-w-40 truncate">{params.manifestId ?? second}</span>
          </span>
        ),
        isLast: true,
      })
    }
  } else if (first === 'deployments') {
    crumbs.push({
      label: <SegmentLabel icon={<Rocket />} text="Deployments" />,
      href: '/deployments',
      isLast: !second,
    })

    if (second) {
      crumbs.push({
        label: (
          <span className="inline-flex items-center gap-1.5">
            <Rocket className="size-3.5 opacity-60 shrink-0" />
            <span className="max-w-40 truncate">{params.deploymentId ?? second}</span>
          </span>
        ),
        isLast: true,
      })
    }
  } else if (first === 'settings') {
    crumbs.push({
      label: <SegmentLabel icon={<Settings />} text="Settings" />,
      isLast: true,
    })
  }

  return crumbs
}

export default function NavBreadcrumb({ className }: { className?: string }) {
  const crumbs = useResolvedCrumbs()

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : crumb.href ? (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              ) : (
                crumb.label
              )}
            </BreadcrumbItem>
            {!crumb.isLast && (
              <BreadcrumbSeparator>
                <ChevronRight className="size-3.5" />
              </BreadcrumbSeparator>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}