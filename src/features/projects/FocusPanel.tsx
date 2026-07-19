import { AlarmClock, ArrowRight, CalendarDays, ChevronDown, ChevronUp, CircleDot, HeartPulse, Pause, Play, RotateCcw, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useFocus } from '../focus/focusContext'
import { usePreferences } from '../preferences/preferencesContext'
import type { TaskOverview } from '../tasks/taskApi'
import type { ProjectWithTasks } from './projectApi'
import { useUpdateProject } from './projectApi'
import { getProjectPulse, recommendProject } from './projectHealth'

const priorityWeight = { high: 3, medium: 2, low: 1 }

export function FocusPanel({ projects, tasks }: { projects: ProjectWithTasks[]; tasks: TaskOverview[] }) {
  const { user } = useAuth()
  const { session, startSession } = useFocus()
  const { preferences } = usePreferences()
  const navigate = useNavigate()
  const updateProject = useUpdateProject()
  const recommendation = recommendProject(projects, tasks)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('devhub-focus-planner-collapsed') === 'true')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [durationPreset, setDurationPreset] = useState(preferences.focusDefaultMinutes)
  const [customMinutes, setCustomMinutes] = useState(45)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [selectionTouched, setSelectionTouched] = useState(false)
  const activeProject = projects.find(project => project.id === selectedProjectId) ?? recommendation?.project
  const pulse = activeProject ? getProjectPulse(activeProject, tasks) : null
  const durationMinutes = durationPreset || customMinutes
  const candidateTasks = activeProject
    ? tasks.filter(task => task.project_id === activeProject.id && task.status !== 'done').sort((a, b) => {
      const overdueA = a.due_date && new Date(`${a.due_date}T23:59:59`) < new Date() ? 1 : 0
      const overdueB = b.due_date && new Date(`${b.due_date}T23:59:59`) < new Date() ? 1 : 0
      return overdueB - overdueA || priorityWeight[b.priority] - priorityWeight[a.priority]
    }).slice(0, 6)
    : []
  const suggestedCount = durationMinutes <= 30 ? 1 : durationMinutes <= 60 ? 2 : 3
  const suggestedTaskIds = candidateTasks.slice(0, suggestedCount).map(task => task.id)
  const effectiveTaskIds = selectionTouched ? selectedTaskIds : suggestedTaskIds
  const rescueProjects = projects.map(project => ({ project, pulse: getProjectPulse(project, tasks) })).filter(item => item.pulse.state === 'stale' || item.pulse.state === 'blocked').slice(0, 3)

  const toggleCollapsed = () => {
    setCollapsed(current => {
      localStorage.setItem('devhub-focus-planner-collapsed', String(!current))
      return !current
    })
  }
  const changeProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedTaskIds([])
    setSelectionTouched(false)
  }
  const toggleTask = (taskId: string) => {
    const current = selectionTouched ? selectedTaskIds : suggestedTaskIds
    setSelectedTaskIds(current.includes(taskId) ? current.filter(id => id !== taskId) : [...current, taskId])
    setSelectionTouched(true)
  }
  const beginFocus = () => {
    if (!user || !activeProject) return
    const selectedTasks = candidateTasks.filter(task => effectiveTaskIds.includes(task.id)).map(task => ({ id: task.id, title: task.title }))
    startSession({ userId: user.id, projectId: activeProject.id, projectName: activeProject.name, tasks: selectedTasks, durationMinutes })
    navigate(`/projects/${activeProject.id}`)
  }
  const changeProjectStatus = async (project: ProjectWithTasks, status: 'in_progress' | 'paused') => {
    await updateProject.mutateAsync({ id: project.id, input: { name: project.name, description: project.description ?? '', status, technologies: project.technologies, repository_url: project.repository_url, live_url: project.live_url } })
  }

  if (!recommendation || !activeProject || !pulse) return null
  return <section className={`momentum-section ${collapsed ? 'focus-planner-collapsed' : ''}`}>
    <article className={`focus-card ${collapsed ? 'collapsed' : ''}`}>
      <div className="focus-card-head">
        <div><p className="eyebrow">MODO FOCUS</p><h2>{collapsed ? `${activeProject.name} · ${durationMinutes} min` : 'Prepará tu sesión'}</h2>{collapsed && <small>Configuración de la próxima sesión</small>}</div>
        <div className="focus-head-actions">{session && <span className="focus-running-badge"><i /> Sesión en curso</span>}<button type="button" className="focus-collapse-button" onClick={toggleCollapsed} aria-expanded={!collapsed} title={collapsed ? 'Expandir modo Focus' : 'Minimizar modo Focus'}>{collapsed ? <ChevronDown /> : <ChevronUp />}<span>{collapsed ? 'Expandir' : 'Minimizar'}</span></button></div>
      </div>
      {!collapsed && <>
        <div className="focus-controls"><label>Proyecto<select value={activeProject.id} onChange={event => changeProject(event.target.value)}>{projects.filter(project => project.status !== 'completed').map(project => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label>Duración<select value={durationPreset} onChange={event => setDurationPreset(Number(event.target.value))}><option value={25}>25 min</option><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>1 hora</option><option value={90}>1 h 30</option><option value={120}>2 horas</option><option value={0}>Personalizada</option></select></label>{durationPreset === 0 && <label>Minutos<input type="number" min="5" max="480" value={customMinutes} onChange={event => setCustomMinutes(Math.min(480, Math.max(5, Number(event.target.value))))} /></label>}</div>
        <div className="focus-project"><div className="pulse-orbit"><HeartPulse /><strong>{pulse.score}</strong></div><div><span>{pulse.label}</span><h3>{activeProject.name}</h3><p>{pulse.overdue ? `${pulse.overdue} tareas vencidas requieren atención.` : `Sesión sugerida de ${durationMinutes} minutos para mantener el impulso.`}</p></div></div>
        <div className="focus-selection-head"><div><strong>Elegí el objetivo</strong><span>{effectiveTaskIds.length} seleccionadas · podés cambiar la sugerencia</span></div><AlarmClock /></div>
        <div className="focus-task-picker">{candidateTasks.length ? candidateTasks.map((task, index) => { const selected = effectiveTaskIds.includes(task.id); return <button className={selected ? 'selected' : ''} type="button" onClick={() => toggleTask(task.id)} key={task.id}><span>{selected ? '✓' : index === 0 ? <Target /> : <CircleDot />}</span><div><small>{task.priority === 'high' ? 'PRIORIDAD ALTA' : task.priority === 'low' ? 'PRIORIDAD BAJA' : 'PRIORIDAD MEDIA'}</small><strong>{task.title}</strong>{task.due_date && <em><CalendarDays /> {new Intl.DateTimeFormat('es-AR').format(new Date(`${task.due_date}T12:00:00`))}</em>}</div></button>}) : <p>Este proyecto no tiene tareas pendientes. Podés iniciar una sesión libre para definir el próximo paso.</p>}</div>
        <div className="focus-start-actions"><button className="button primary" onClick={beginFocus} disabled={Boolean(session)}><Play size={16} /> {session ? 'Ya hay una sesión activa' : `Comenzar ${durationMinutes} min`}</button><Link className="button" to={`/projects/${activeProject.id}`}>Abrir proyecto <ArrowRight size={15} /></Link></div>
      </>}
    </article>
    {rescueProjects.length > 0 && <article className="rescue-card"><div className="rescue-head"><span><RotateCcw /></span><div><p className="eyebrow">RESCUE MODE</p><h2>Proyectos que necesitan una decisión</h2></div></div><div className="rescue-list">{rescueProjects.map(({ project, pulse: rescuePulse }) => <div key={project.id}><div><strong>{project.name}</strong><span>{rescuePulse.label} · {rescuePulse.daysInactive} días sin actividad</span></div><div>{project.status === 'paused' ? <button title="Reactivar" onClick={() => changeProjectStatus(project, 'in_progress')}><Play /></button> : <button title="Pausar conscientemente" onClick={() => changeProjectStatus(project, 'paused')}><Pause /></button>}<Link title="Revisar alcance" to={`/projects/${project.id}`}><ArrowRight /></Link></div></div>)}</div></article>}
  </section>
}
