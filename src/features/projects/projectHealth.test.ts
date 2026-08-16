import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TaskOverview } from '../tasks/taskApi'
import type { ProjectWithTasks } from './projectApi'
import { getProjectPulse, recommendProject } from './projectHealth'

const now = new Date('2026-08-16T15:00:00Z')

function project(overrides: Partial<ProjectWithTasks> = {}): ProjectWithTasks {
  return {
    id: 'project-1', user_id: 'user-1', name: 'DevHub', description: null,
    status: 'in_progress', technologies: [], repository_url: null, live_url: null,
    is_public: false, public_slug: null, published_at: null,
    created_at: '2026-07-01T12:00:00Z', updated_at: '2026-08-16T12:00:00Z', tasks: [],
    ...overrides,
  }
}

function task(overrides: Partial<TaskOverview> = {}): TaskOverview {
  return {
    id: 'task-1', project_id: 'project-1', project_name: 'DevHub', project_status: 'in_progress',
    title: 'Publicar demo', description: null, status: 'todo', priority: 'medium', due_date: null,
    created_at: '2026-08-15T12:00:00Z', updated_at: '2026-08-15T12:00:00Z',
    ...overrides,
  }
}

describe('Project Pulse', () => {
  beforeEach(() => vi.useFakeTimers({ now }))
  afterEach(() => vi.useRealTimers())

  it('marca como listo un proyecto con todas sus tareas completas', () => {
    const pulse = getProjectPulse(project(), [task({ status: 'done' })])
    expect(pulse).toMatchObject({ state: 'ready', label: 'Listo para publicar', score: 96, pending: 0 })
  })

  it('detecta un proyecto detenido por inactividad', () => {
    const pulse = getProjectPulse(project({ updated_at: '2026-07-10T12:00:00Z' }), [task()])
    expect(pulse.state).toBe('stale')
    expect(pulse.daysInactive).toBe(37)
  })

  it('prioriza un proyecto activo con tareas urgentes', () => {
    const regular = project({ id: 'regular', name: 'Regular' })
    const urgent = project({ id: 'urgent', name: 'Urgente' })
    const recommendation = recommendProject([regular, urgent], [
      task({ id: 'r1', project_id: 'regular', priority: 'low' }),
      task({ id: 'u1', project_id: 'urgent', priority: 'high', due_date: '2026-08-10' }),
    ])
    expect(recommendation.project.id).toBe('urgent')
  })
})
