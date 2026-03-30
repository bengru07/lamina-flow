import * as React from 'react'
import { Search, SlidersHorizontal, LayoutGrid, List, Plus, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Workspace } from '@/types/workspace'

export type ViewVariant = 'card' | 'table'

export interface WorkspaceListHeaderProps {
  workspaces: Workspace[]
  view: ViewVariant
  onViewChange: (v: ViewVariant) => void
  onSearchChange: (query: string) => void
  onTagFilterChange: (tags: string[]) => void
  activeTags: string[]
  actionLabel?: string
  onAction?: () => void
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timeoutDelay = value == '' ? 0 : delay
    const t = setTimeout(() => setDebounced(value), timeoutDelay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function WorkspaceListHeader({
  workspaces,
  view,
  onViewChange,
  onSearchChange,
  onTagFilterChange,
  activeTags,
  actionLabel = 'New workspace',
  onAction,
}: WorkspaceListHeaderProps) {
  const [inputValue, setInputValue] = React.useState('')
  const debouncedInput = useDebounced(inputValue.trim(), 500)

  React.useEffect(() => {
    onSearchChange(debouncedInput)
  }, [debouncedInput, onSearchChange])

  const allTags = React.useMemo(
    () => Array.from(new Set(workspaces.flatMap((w) => w.tags ?? []))).sort(),
    [workspaces],
  )

  const toggleTag = React.useCallback(
    (tag: string) => {
      onTagFilterChange(
        activeTags.includes(tag)
          ? activeTags.filter((t) => t !== tag)
          : [...activeTags, tag],
      )
    },
    [activeTags, onTagFilterChange],
  )

  const clearTags = React.useCallback(() => onTagFilterChange([]), [onTagFilterChange])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search workspaces…"
          className="pl-8 h-8 w-52 text-sm"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-sm font-normal',
              activeTags.length > 0 && 'border-primary/60 bg-primary/5 text-primary hover:bg-primary/10',
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Tags
            {activeTags.length > 0 && (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeTags.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="flex items-center justify-between py-1.5">
            <span>Filter by tag</span>
            {activeTags.length > 0 && (
              <button
                onClick={clearTags}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allTags.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground text-center">No tags found</p>
          ) : (
            allTags.map((tag) => {
              const active = activeTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    active && 'text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                      active ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {active && <Check className="size-2.5" />}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              )
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {activeTags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {activeTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="h-6 gap-1 pl-2 pr-1 text-xs font-normal"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="flex items-center rounded-sm opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${tag} filter`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => onViewChange('card')}
            aria-label="Card view"
            className={cn(
              'flex items-center justify-center px-2.5 h-8 transition-colors',
              view === 'card'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => onViewChange('table')}
            aria-label="Table view"
            className={cn(
              'flex items-center justify-center px-2.5 h-8 transition-colors',
              view === 'table'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            <List className="size-3.5" />
          </button>
        </div>

        {onAction && (
          <Button size="sm" className="h-8 gap-1.5" onClick={onAction}>
            <Plus className="size-3.5" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}