import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  danger?: boolean
  footer?: React.ReactNode
  className?: string
}

export function SectionCard({ title, description, action, children, danger, footer, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', danger ? 'border-destructive/30' : 'border-border', className)}>
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className={cn('flex items-center gap-2', danger && 'text-destructive/80')}>
            {danger && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive/70">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
            )}
            <p className="text-[13px] font-medium text-foreground">{title}</p>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <Separator />
      <div>{children}</div>
      {footer && (
        <>
          <Separator />
          <div className="px-5 py-3">{footer}</div>
        </>
      )}
    </div>
  )
}

interface SectionCardRowProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function SectionCardRow({ label, hint, children }: SectionCardRowProps) {
  return (
    <div className="grid grid-cols-[180px_1fr] items-start px-5 py-4 gap-x-6 border-b border-border last:border-0">
      <div className="pt-2">
        <p className="text-[13px] text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="px-5 py-10 flex flex-col items-center justify-center text-center">
      <div className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">{description}</p>
    </div>
  )
}