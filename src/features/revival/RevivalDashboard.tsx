import { Activity, ArrowRight, Brain, Check, Clock3, Copy, Flame, Play, RotateCcw, Share2, Sparkles, Target, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import type { FocusSessionWithProject } from '../focus/focusApi'
import { useFocus } from '../focus/focusContext'
import type { ProjectWithTasks } from '../projects/projectApi'
import type { TaskOverview } from '../tasks/taskApi'
import { formatRelativeActivity, getBuildReceipt, getProjectDNA, getRevivalPlans } from './revivalEngine'

export function RevivalDashboard({ projects, tasks, sessions }: { projects: ProjectWithTasks[]; tasks: TaskOverview[]; sessions: FocusSessionWithProject[] }) {
  const { user } = useAuth()
  const { session, startSession } = useFocus()
  const navigate = useNavigate()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const plans = getRevivalPlans(projects, tasks, sessions)
  const recommendation = plans[0]
  const atRisk = plans.filter(plan => plan.riskScore >= 25 || plan.daysInactive >= 7).slice(0, 4)
  const dna = getProjectDNA(sessions)
  const receipt = getBuildReceipt(projects, tasks, sessions)

  if (!recommendation) return null

  const startRescue = () => {
    if (!user || session) return
    const selectedTasks = recommendation.nextTask ? [{ id: recommendation.nextTask.id, title: recommendation.nextTask.title }] : []
    startSession({ userId: user.id, projectId: recommendation.project.id, projectName: recommendation.project.name, tasks: selectedTasks, durationMinutes: recommendation.rescueMinutes })
    navigate(`/projects/${recommendation.project.id}`)
  }

  const receiptText = `Mi semana construyendo con DevHub\n\n⏱ ${receipt.focusedMinutes} minutos de foco\n✓ ${receipt.completedTasks} tareas completadas\n🚀 ${receipt.activeProjects} proyectos con actividad\n↻ ${receipt.rescuedProjects} proyectos retomados\n\nSeguir construyendo también cuenta.`
  const copyReceipt = async () => {
    await navigator.clipboard.writeText(receiptText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <section className="revival-dashboard" aria-label="Project Revival">
    <div className="revival-heading"><div><p className="eyebrow"><RotateCcw /> PROJECT REVIVAL</p><h2>Volvé exactamente donde lo dejaste</h2><p>DevHub reconstruye el contexto y reduce el esfuerzo de retomar.</p></div><button className="button" onClick={() => setReceiptOpen(true)}><Share2 /> Mi semana</button></div>
    <div className="revival-grid">
      <article className="revival-hero">
        <div className="revival-hero-top"><span className="revival-brain"><Brain /></span><div><p className="eyebrow">SESIÓN DE RESCATE SUGERIDA</p><span>Actividad {formatRelativeActivity(recommendation.daysInactive)}</span></div><strong>{recommendation.rescueMinutes}<small>min</small></strong></div>
        <h3>Retomá {recommendation.project.name}</h3>
        <p className="revival-context">{recommendation.context}</p>
        <div className="revival-next"><Target /><div><small>SIGUIENTE ACCIÓN</small><strong>{recommendation.nextAction}</strong></div></div>
        {recommendation.latestSession?.outcome && <blockquote><Sparkles /> “{recommendation.latestSession.outcome}”<small>Tu último resultado guardado</small></blockquote>}
        <div className="revival-actions"><button className="button primary" disabled={Boolean(session)} onClick={startRescue}><Play /> {session ? 'Ya hay una sesión activa' : `Empezar rescate de ${recommendation.rescueMinutes} min`}</button><Link className="button" to={`/projects/${recommendation.project.id}`}>Ver memoria <ArrowRight /></Link></div>
      </article>
      <article className="revival-radar">
        <div className="revival-card-title"><span><Activity /></span><div><p className="eyebrow">RADAR DE ABANDONO</p><h3>Proyectos que pueden perder impulso</h3></div></div>
        <div className="revival-risk-list">{atRisk.length ? atRisk.map(plan => <Link to={`/projects/${plan.project.id}`} key={plan.project.id}><span className={`risk-dot ${plan.riskScore >= 55 ? 'high' : plan.riskScore >= 30 ? 'medium' : 'low'}`} /><div><strong>{plan.project.name}</strong><small>{plan.daysInactive ? `${plan.daysInactive} días sin actividad` : plan.pulse.label}</small></div><b>{plan.riskScore}<small>%</small></b><ArrowRight /></Link>) : <div className="revival-empty"><Check /><span><strong>Buen ritmo general</strong><small>Ningún proyecto muestra señales de abandono.</small></span></div>}</div>
      </article>
      <article className="project-dna-card">
        <div className="revival-card-title"><span><Flame /></span><div><p className="eyebrow">PROJECT DNA</p><h3>Tu forma real de construir</h3></div></div>
        {sessions.length ? <div className="dna-metrics"><div><strong>{dna.idealMinutes} min</strong><span>Duración ideal</span></div><div><strong>{dna.bestHourLabel}</strong><span>Franja más productiva</span></div><div><strong>{dna.followThrough}%</strong><span>Sesiones aprovechadas</span></div><div><strong>{dna.activeDays}</strong><span>Días con foco</span></div></div> : <div className="revival-empty"><Clock3 /><span><strong>Tu patrón aparecerá pronto</strong><small>Completá algunas sesiones Focus para descubrirlo.</small></span></div>}
      </article>
    </div>
    {receiptOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setReceiptOpen(false) }}><section className="task-modal build-receipt-modal"><div className="modal-head"><div><p className="eyebrow">BUILD RECEIPT</p><h2>Tu semana construyendo</h2></div><button className="icon-button" onClick={() => setReceiptOpen(false)} aria-label="Cerrar"><X /></button></div><div className="build-receipt"><span className="receipt-logo">{'</>'}</span><p>DEVHUB · ÚLTIMOS 7 DÍAS</p><strong>{receipt.focusedMinutes}<small> minutos enfocado</small></strong><div><span><b>{receipt.sessions}</b> sesiones</span><span><b>{receipt.completedTasks}</b> tareas completadas</span><span><b>{receipt.activeProjects}</b> proyectos activos</span><span><b>{receipt.rescuedProjects}</b> retomados</span></div><footer>Seguir construyendo también cuenta.</footer></div><div className="form-actions"><button className="button" onClick={() => setReceiptOpen(false)}>Cerrar</button><button className="button primary" onClick={copyReceipt}>{copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar resumen'}</button></div></section></div>}
  </section>
}
