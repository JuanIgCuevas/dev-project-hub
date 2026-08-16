import { Brain, CheckCircle2, Clock3, History, MessageSquareQuote, Play, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ProjectDetails } from '../projects/projectApi'
import { useAuth } from '../auth/AuthProvider'
import { useProjectFocusSessions } from '../focus/focusApi'
import { useFocus } from '../focus/focusContext'

function relativeSessionDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

export function ProjectRevivalMemory({ project }: { project: ProjectDetails }) {
  const { user } = useAuth()
  const { session, startSession } = useFocus()
  const navigate = useNavigate()
  const { data: sessions = [], isLoading } = useProjectFocusSessions(project.id)
  const latest = sessions[0]
  const pendingTasks = project.tasks.filter(task => task.status !== 'done').sort((a, b) => {
    const priority = { high: 0, medium: 1, low: 2 }
    return priority[a.priority] - priority[b.priority]
  })
  const nextTask = pendingTasks[0]
  const nextAction = latest?.next_step?.trim() || nextTask?.title || 'Definir el próximo avance concreto.'
  const nextActionIsUserContent = Boolean(latest?.next_step?.trim() || nextTask?.title)
  const duration = latest ? Math.max(15, Math.min(45, Math.round(latest.focused_seconds / 60 / 5) * 5 || 20)) : 20

  const beginRescue = () => {
    if (!user || session) return
    startSession({ userId: user.id, projectId: project.id, projectName: project.name, tasks: nextTask ? [{ id: nextTask.id, title: nextTask.title }] : [], durationMinutes: duration })
    navigate(`/projects/${project.id}`)
  }

  return <section className="panel project-memory-panel">
    <div className="panel-head"><div><p className="eyebrow"><Brain /> MEMORIA DEL PROYECTO</p><h2>Tu contexto para volver</h2><p>Lo importante de la última sesión, preparado para tu yo del futuro.</p></div>{latest && <span className="memory-date"><History /> {relativeSessionDate(latest.completed_at)}</span>}</div>
    {isLoading ? <div className="intelligence-loading"><span className="mini-loader" /> Reconstruyendo contexto...</div> : <div className="memory-grid">
      <div className="memory-trail">
        <article><span><CheckCircle2 /></span><div><small>ÚLTIMO RESULTADO</small><strong>{latest?.outcome ? <span data-no-translate>{latest.outcome}</span> : 'Todavía no registraste qué resolviste.'}</strong></div></article>
        <article><span><Clock3 /></span><div><small>QUEDÓ PENDIENTE</small><strong>{latest?.pending ? <span data-no-translate>{latest.pending}</span> : pendingTasks.length ? `${pendingTasks.length} tareas esperan atención.` : 'No hay pendientes registrados.'}</strong></div></article>
        <article className="future-message"><span><MessageSquareQuote /></span><div><small>MENSAJE PARA TU PRÓXIMA SESIÓN</small><strong>{nextActionIsUserContent ? <span data-no-translate>{nextAction}</span> : nextAction}</strong></div></article>
      </div>
      <aside className="memory-rescue"><Target /><p className="eyebrow">ACCIÓN MÍNIMA VIABLE</p><h3>{nextActionIsUserContent ? <span data-no-translate>{nextAction}</span> : nextAction}</h3><span>{duration} minutos para recuperar el impulso sin sobrecargarte.</span><button className="button primary" onClick={beginRescue} disabled={Boolean(session)}><Play /> {session ? 'Sesión en curso' : `Retomar durante ${duration} min`}</button></aside>
    </div>}
  </section>
}
