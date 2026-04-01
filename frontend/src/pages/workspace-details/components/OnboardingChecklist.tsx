import { useState, useEffect } from 'react'
import {
  Workflow, Database, ShieldCheck,
  Webhook, BookOpen, Circle, CheckCircle2,
 ChevronRight
} from 'lucide-react'
import { SectionCard } from '@/components/common/SectionCard'

const ONBOARDING_STEPS = [
  { id: 'create-workflow', title: 'Create your first workflow', description: 'Build an automation pipeline in the visual editor.', icon: <Workflow size={14} />, actionLabel: 'Open editor' },
  { id: 'add-datasource', title: 'Connect a data source', description: 'Link a database, API, or file source to power your workflows.', icon: <Database size={14} />, actionLabel: 'Add connection' },
  { id: 'configure-webhook', title: 'Set up a webhook trigger', description: 'Trigger workflows automatically from external events.', icon: <Webhook size={14} />, actionLabel: 'Configure' },
  { id: 'enable-auth', title: 'Enable authentication', description: 'Protect endpoints and manage access control.', icon: <ShieldCheck size={14} />, actionLabel: 'Set up auth' },
  { id: 'read-docs', title: 'Explore the documentation', description: 'Learn advanced features, best practices, and integrations.', icon: <BookOpen size={14} />, actionLabel: 'Read docs' },
]

export function OnboardingChecklist({ workspaceId }: { workspaceId: string }) {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`onboarding-${workspaceId}`)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(`onboarding-${workspaceId}`, JSON.stringify([...completed]))
  }, [completed, workspaceId])

  const toggle = (id: string) =>
    setCompleted(prev => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const progress = (completed.size / ONBOARDING_STEPS.length) * 100

  return (
    <SectionCard
      title="Getting started"
      description="Complete these steps to configure your project."
      footer={
        <div className="flex items-center gap-3">
          <div className="flex-1 h-0.75 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{completed.size}/{ONBOARDING_STEPS.length}</span>
        </div>
      }
    >
      <div className="divide-y divide-border">
        {ONBOARDING_STEPS.map(step => {
          const done = completed.has(step.id)
          return (
            <div key={step.id} className={`flex items-start gap-3.5 px-5 py-3.5 transition-colors ${done ? 'bg-muted/20' : 'hover:bg-muted/10'}`}>
              <button onClick={() => toggle(step.id)} className="mt-0.5 shrink-0">
                {done
                  ? <CheckCircle2 size={16} className="text-emerald-500" />
                  : <Circle size={16} className="text-muted-foreground/30 hover:text-muted-foreground transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-muted-foreground/60 ${done ? 'opacity-30' : ''}`}>{step.icon}</span>
                  <p className={`text-[13px] font-medium ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{step.title}</p>
                </div>
                {!done && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 ml-5.5">{step.description}</p>}
              </div>
              {!done && (
                <button className="text-xs text-muted-foreground hover:text-foreground shrink-0 mt-0.5 flex items-center gap-1 transition-colors">
                  {step.actionLabel}<ChevronRight size={11} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
