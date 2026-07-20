import type { FocusSessionWithProject } from '../focus/focusApi'
import type { ProjectWithTasks } from '../projects/projectApi'
import { getProjectPulse } from '../projects/projectHealth'
import type { TaskOverview } from '../tasks/taskApi'

const dayMs = 86_400_000

export interface RevivalPlan {
  project: ProjectWithTasks
  pulse: ReturnType<typeof getProjectPulse>
  latestSession?: FocusSessionWithProject
  nextTask?: TaskOverview
  nextAction: string
  context: string
  daysInactive: number
  riskScore: number
  rescueMinutes: number
}

export interface ProjectDNA {
  totalMinutes: number
  averageMinutes: number
  idealMinutes: number
  bestHourLabel: string
  activeDays: number
  followThrough: number
}

export interface BuildReceipt {
  focusedMinutes: number
  sessions: number
  completedTasks: number
  activeProjects: number
  rescuedProjects: number
}

function latestTimestamp(project: ProjectWithTasks, tasks: TaskOverview[], sessions: FocusSessionWithProject[]) {
  const timestamps = [
    new Date(project.updated_at).getTime(),
    ...tasks.filter(task => task.project_id === project.id).map(task => new Date(task.updated_at).getTime()),
    ...sessions.filter(session => session.project_id === project.id).map(session => new Date(session.completed_at).getTime()),
  ].filter(Number.isFinite)
  return Math.max(...timestamps)
}

function sortPendingTasks(tasks: TaskOverview[]) {
  const priority = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    const overdueA = a.due_date && new Date(`${a.due_date}T23:59:59`).getTime() < Date.now() ? 0 : 1
    const overdueB = b.due_date && new Date(`${b.due_date}T23:59:59`).getTime() < Date.now() ? 0 : 1
    return overdueA - overdueB || priority[a.priority] - priority[b.priority] || new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

export function getRevivalPlans(projects: ProjectWithTasks[], tasks: TaskOverview[], sessions: FocusSessionWithProject[]) {
  return projects
    .filter(project => project.status !== 'completed')
    .map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id)
      const pendingTasks = sortPendingTasks(projectTasks.filter(task => task.status !== 'done'))
      const projectSessions = sessions.filter(session => session.project_id === project.id)
      const latestSession = projectSessions[0]
      const pulse = getProjectPulse(project, tasks)
      const daysInactive = Math.max(0, Math.floor((Date.now() - latestTimestamp(project, tasks, sessions)) / dayMs))
      const overdue = pendingTasks.filter(task => task.due_date && new Date(`${task.due_date}T23:59:59`).getTime() < Date.now()).length
      const riskScore = Math.min(100, Math.round(daysInactive * 3 + overdue * 12 + (project.status === 'paused' ? 24 : 0) + (pendingTasks.length > 8 ? 8 : 0) + (!latestSession ? 6 : 0)))
      const nextTask = pendingTasks[0]
      const nextAction = latestSession?.next_step?.trim() || nextTask?.title || 'Definir una tarea pequeña que deje un resultado visible.'
      const context = latestSession?.pending?.trim()
        ? `Quedó pendiente: ${latestSession.pending}`
        : latestSession?.outcome?.trim()
          ? `Último avance: ${latestSession.outcome}`
          : nextTask
            ? `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarea pendiente' : 'tareas pendientes'} en el proyecto.`
            : 'Todavía no hay una memoria de trabajo. Esta sesión puede definir el próximo paso.'
      const rescueMinutes = riskScore >= 55 ? 20 : nextTask?.priority === 'high' ? 30 : 25
      return { project, pulse, latestSession, nextTask, nextAction, context, daysInactive, riskScore, rescueMinutes } satisfies RevivalPlan
    })
    .sort((a, b) => b.riskScore - a.riskScore || b.pulse.overdue - a.pulse.overdue || Number(b.project.status === 'in_progress') - Number(a.project.status === 'in_progress'))
}

export function getProjectDNA(sessions: FocusSessionWithProject[]): ProjectDNA {
  if (!sessions.length) return { totalMinutes: 0, averageMinutes: 0, idealMinutes: 25, bestHourLabel: 'Todavía por descubrir', activeDays: 0, followThrough: 0 }
  const totalSeconds = sessions.reduce((total, session) => total + session.focused_seconds, 0)
  const averageMinutes = Math.max(1, Math.round(totalSeconds / sessions.length / 60))
  const idealMinutes = averageMinutes <= 27 ? 25 : averageMinutes <= 38 ? 30 : averageMinutes <= 52 ? 45 : averageMinutes <= 75 ? 60 : 90
  const hours = sessions.reduce<Record<number, number>>((result, session) => {
    const hour = new Date(session.started_at).getHours()
    result[hour] = (result[hour] ?? 0) + session.focused_seconds
    return result
  }, {})
  const bestHour = Number(Object.entries(hours).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 0)
  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00–${((hour + 2) % 24).toString().padStart(2, '0')}:00`
  const activeDays = new Set(sessions.map(session => new Date(session.completed_at).toDateString())).size
  const followThrough = Math.min(100, Math.round(sessions.reduce((total, session) => total + Math.min(1, session.focused_seconds / session.planned_seconds), 0) / sessions.length * 100))
  return { totalMinutes: Math.round(totalSeconds / 60), averageMinutes, idealMinutes, bestHourLabel: formatHour(bestHour), activeDays, followThrough }
}

export function getBuildReceipt(projects: ProjectWithTasks[], tasks: TaskOverview[], sessions: FocusSessionWithProject[]): BuildReceipt {
  const weekStart = Date.now() - 7 * dayMs
  const weekSessions = sessions.filter(session => new Date(session.completed_at).getTime() >= weekStart)
  const activeProjectIds = new Set(weekSessions.map(session => session.project_id))
  const completedTasks = tasks.filter(task => task.status === 'done' && new Date(task.updated_at).getTime() >= weekStart).length
  const rescuedProjects = projects.filter(project => {
    const latest = weekSessions.find(session => session.project_id === project.id)
    if (!latest) return false
    const previous = sessions.find(session => session.project_id === project.id && session.id !== latest.id)
    return !previous || new Date(latest.completed_at).getTime() - new Date(previous.completed_at).getTime() >= 7 * dayMs
  }).length
  return {
    focusedMinutes: Math.round(weekSessions.reduce((total, session) => total + session.focused_seconds, 0) / 60),
    sessions: weekSessions.length,
    completedTasks,
    activeProjects: activeProjectIds.size,
    rescuedProjects,
  }
}

export function formatRelativeActivity(days: number) {
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}
