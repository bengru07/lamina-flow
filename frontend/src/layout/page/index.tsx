import { Separator } from '@/components/ui/separator'

interface PageLayoutProps {
  title: React.ReactNode | string
  description?: React.ReactNode | string
  headerActions?: React.ReactNode
  children: React.ReactNode
  useSeparator?: boolean

  useHeaderContainer?: boolean
  useChildContainer?: boolean
}

export default function PageLayout({ title, description, headerActions, children, useSeparator, useChildContainer=true, useHeaderContainer=true }: PageLayoutProps) {
  return (
    <main className={`flex flex-col w-full h-full overflow-hidden ${useChildContainer ? 'max-w-7xl mx-auto px-20 pt-16' : ''}`}>
      <header className={`shrink-0 flex items-center justify-between ${useHeaderContainer ? 'w-full max-w-7xl mx-auto px-20 pt-16' : ''}`}>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">{headerActions}</div>
        )}
      </header>
      {useSeparator && <Separator />}
      {!useSeparator && <div className="my-4" />}
      <section className={`flex-1 overflow-hidden pt-1 ${useChildContainer ? 'w-full max-w-7xl mx-auto px-20' : ''}`}>
        {children}
      </section>
    </main>
  )
}