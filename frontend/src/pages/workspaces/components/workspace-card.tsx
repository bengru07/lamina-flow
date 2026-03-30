import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/types/workspace'

export interface WorkspaceCardAction {
  label: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
}

export interface WorkspaceCardProps {
  workspace: Workspace
  onClick?: (workspace: Workspace) => void
  actions?: WorkspaceCardAction[]
  className?: string
}

export function WorkspaceCard({ workspace, onClick, actions, className }: WorkspaceCardProps) {
  return (
    <Card
      onClick={() => onClick?.(workspace)}
      className={cn(
        'ring-0 rounded-sm border px-2 py-6 max-w-96 min-w-64 w-full space-y-5 transition duration-150',
        onClick && 'cursor-pointer hover:bg-muted/60',
        className,
      )}
    >
      <CardHeader className="w-full flex flex-row justify-between">
        <div className="space-y-0.5 min-w-0">
          <h3 className="text-md font-semibold truncate">{workspace.name}</h3>
          {workspace.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{workspace.description}</p>
          )}
        </div>

        {actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              {actions.map((action, i) => (
                <DropdownMenuItem
                  key={i}
                  className={cn('text-xs', action.danger && 'text-destructive focus:text-destructive')}
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick(e)
                  }}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="flex justify-between items-end">
        {workspace.tags?.length > 0 ? (
          <div className="flex items-center gap-1 flex-wrap">
            {workspace.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] p-2 py-2.5">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <span />
        )}
        <p className="text-xs text-muted-foreground mt-0.5 shrink-0">
          {new Date(workspace.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  )
}

export interface WorkspaceEmptyCardProps {
  label?: string
  description?: string
  icon?: LucideIcon
  onClick?: () => void
  className?: string
}

export function WorkspaceEmptyCard({
  label = 'New workspace',
  description,
  icon: Icon = Plus,
  onClick,
  className,
}: WorkspaceEmptyCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'ring-0 rounded-sm border border-dashed px-2 py-6 max-w-96 min-w-64 w-full space-y-5 transition duration-150',
        'flex flex-col items-center justify-center min-h-36',
        'text-muted-foreground hover:text-foreground hover:bg-muted/40 hover:border-muted-foreground/40',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 select-none">
        <div className="flex items-center justify-center size-8 rounded-md border border-dashed border-current">
          <Icon className="size-4" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </Card>
  )
}