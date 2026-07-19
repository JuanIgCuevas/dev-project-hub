import { AlarmClock, ArrowRight, CalendarDays, CircleDot, HeartPulse, Pause, Play, RotateCcw, Target } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TaskOverview } from '../tasks/taskApi'
import type { ProjectWithTasks } from './projectApi'
import { useUpdateProject } from './projectApi'
import { getProjectPulse, recommendProject } from './projectHealth'

export function FocusPanel({ projects, tasks }: { projects: ProjectWithTasks[]; tasks: TaskOverview[] }) {
  const updateProject = useUpdateProject()
  const [duration, setDuration] = useState(60)
  const recommendation = recommendProject(projects, tasks)
  const rescueProjects = projects
    .map(project => ({ project, pulse: getProjectPulse(project, tasks) }))
    .filter(item => item.pulse.state === 'stale' || item.pulse.state === 'blocked')
    .slice(0, 3)

  const changeProjectStatus = async (project: ProjectWithTasks, status: 'in_progress' | 'paused') => {
    await updateProject.mutateAsync({ id: project.id, input: { name: project.name, description: project.description ?? '', status, technologies: project.technologies, repository_url: project.repository_url, live_url: project.live_url } })
  }

  const focusTasks = recommendation?.tasks
    .sort((a, b) => {
      const overdueA = a.due_date && new Date(`${a.due_date}T23:59:59`) < new Date() ? 1 : 0
      const overdueB = b.due_date && new Date(`${b.due_date}T23:59:59`) < new Date() ? 1 : 0
      const priority = { high: 3, medium: 2, low: 1 }
      return overdueB - overdueA || priority[b.priority] - priority[a.priority]
    })
    .slice(0, duration === 30 ? 1 : duration === 60 ? 2 : 3) ?? []

  if (!recommendation) return null
  return <section className="momentum-section"><article className="focus-card"><div className="focus-card-head"><div><p className="eyebrow">MODO FOCUS</p><h2>Tu mejor próximo paso</h2></div><label><AlarmClock size={15} /><select value={duration} onChange={event => setDuration(Number(event.target.value))}><option value={30}>30 min</option><option value={60}>1 hora</option><option value={120}>2 horas</option></select></label></div><div className="focus-project"><div className="pulse-orbit"><HeartPulse /><strong>{recommendation.pulse.score}</strong></div><div><span>{recommendation.pulse.label}</span><h3>{recommendation.project.name}</h3><p>{recommendation.pulse.overdue ? `${recommendation.pulse.overdue} tareas vencidas requieren atención.` : 'Este proyecto tiene el mejor equilibrio entre impulso y prioridad.'}</p></div></div><div className="focus-task-list">{focusTasks.length ? focusTasks.map((task, index) => <div key={task.id}><span>{index === 0 ? <Target /> : <CircleDot />}</span><div><small>{index === 0 ? 'TAREA PRINCIPAL' : 'SIGUIENTE PASO'}</small><strong>{task.title}</strong>{task.due_date && <em><CalendarDays /> {new Intl.DateTimeFormat('es-AR').format(new Date(`${task.due_date}T12:00:00`))}</em>}</div></div>) : <p>No tiene tareas pendientes. Definí el próximo paso para mantener el impulso.</p>}</div><Link className="button primary" to={`/projects/${recommendation.project.id}`}><Play size={16} /> Empezar sesión <ArrowRight size={15} /></Link></article>{rescueProjects.length > 0 && <article className="rescue-card"><div className="rescue-head"><span><RotateCcw /></span><div><p className="eyebrow">RESCUE MODE</p><h2>Proyectos que necesitan una decisión</h2></div></div><div className="rescue-list">{rescueProjects.map(({ project, pulse }) => <div key={project.id}><div><strong>{project.name}</strong><span>{pulse.label} · {pulse.daysInactive} días sin actividad</span></div><div>{project.status === 'paused' ? <button title="Reactivar" onClick={() => changeProjectStatus(project, 'in_progress')}><Play /></button> : <button title="Pausar conscientemente" onClick={() => changeProjectStatus(project, 'paused')}><Pause /></button>}<Link title="Revisar alcance" to={`/projects/${project.id}`}><ArrowRight /></Link></div></div>)}</div></article>}</section>
}
