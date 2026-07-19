import type { ProjectWithTasks } from './projectApi'
import type { TaskOverview } from '../tasks/taskApi'

export type PulseState = 'moving' | 'slowing' | 'blocked' | 'stale' | 'ready'

export function getProjectPulse(project: ProjectWithTasks, tasks: TaskOverview[]) {
  const projectTasks = tasks.filter(task => task.project_id === project.id)
  const pending = projectTasks.filter(task => task.status !== 'done')
  const overdue = pending.filter(task => task.due_date && new Date(`${task.due_date}T23:59:59`) < new Date()).length
  const daysInactive = Math.max(0, Math.floor((Date.now() - new Date(project.updated_at).getTime()) / 86_400_000))
  const completion = projectTasks.length ? projectTasks.filter(task => task.status === 'done').length / projectTasks.length : 0
  const score = project.status === 'completed'
    ? 100
    : Math.max(5, Math.min(98, Math.round(72 + completion * 24 - Math.min(daysInactive * 1.5, 35) - overdue * 8 - (project.status === 'paused' ? 18 : 0))))
  let state: PulseState = 'moving'
  if (project.status === 'completed' || (completion === 1 && projectTasks.length > 0)) state = 'ready'
  else if (daysInactive >= 21) state = 'stale'
  else if (project.status === 'paused' || overdue >= 3) state = 'blocked'
  else if (daysInactive >= 9 || overdue > 0) state = 'slowing'
  const labels: Record<PulseState, string> = { moving: 'En movimiento', slowing: 'Perdiendo ritmo', blocked: 'Bloqueado', stale: 'Necesita rescate', ready: 'Listo para publicar' }
  return { state, label: labels[state], score, daysInactive, pending: pending.length, overdue }
}

export function recommendProject(projects: ProjectWithTasks[], tasks: TaskOverview[]) {
  return projects
    .filter(project => project.status !== 'completed')
    .map(project => {
      const pulse = getProjectPulse(project, tasks)
      const projectTasks = tasks.filter(task => task.project_id === project.id && task.status !== 'done')
      const high = projectTasks.filter(task => task.priority === 'high').length
      const statusWeight = project.status === 'in_progress' ? 18 : project.status === 'idea' ? 7 : 0
      return { project, pulse, tasks: projectTasks, priority: pulse.overdue * 12 + high * 7 + Math.min(projectTasks.length, 5) + statusWeight }
    })
    .sort((a, b) => b.priority - a.priority)[0]
}
