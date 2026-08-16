import { ArrowRight, FolderPlus, Lightbulb, ListTodo } from 'lucide-react'
import type { ReactNode } from 'react'

export function PageSkeleton({ variant = 'cards', label = 'Cargando contenido...' }: { variant?: 'cards' | 'list' | 'detail'; label?: string }) {
  const count = variant === 'detail' ? 2 : variant === 'list' ? 5 : 6
  return <div className={`page-skeleton ${variant}`} role="status" aria-label={label}><span className="sr-only">{label}</span>{Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index}><i /><i /><i /><i /></div>)}</div>
}

export function EmptyState({ kind = 'projects', title, description, action }: { kind?: 'projects' | 'tasks' | 'ideas'; title: string; description: string; action?: ReactNode }) {
  const Icon = kind === 'tasks' ? ListTodo : kind === 'ideas' ? Lightbulb : FolderPlus
  return <div className={`empty-state enhanced-empty ${kind}`}><span><Icon /></span><div><h2>{title}</h2><p>{description}</p></div>{action && <div className="empty-state-action">{action}<ArrowRight /></div>}</div>
}
