import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { TaskForm } from '../tasks/TaskForm'
import { ProjectForm } from './ProjectForm'

const createProject = vi.fn()
const createTask = vi.fn()
const toast = vi.fn()

vi.mock('../auth/AuthProvider', async importOriginal => {
  const original = await importOriginal<typeof import('../auth/AuthProvider')>()
  return { ...original, useAuth: () => ({ user: { id: 'user-1' } }) }
})
vi.mock('./projectApi', async importOriginal => {
  const original = await importOriginal<typeof import('./projectApi')>()
  return { ...original, useCreateProject: () => ({ mutateAsync: createProject }), useUpdateProject: () => ({ mutateAsync: vi.fn() }) }
})
vi.mock('../tasks/taskApi', async importOriginal => {
  const original = await importOriginal<typeof import('../tasks/taskApi')>()
  return { ...original, useCreateTask: () => ({ mutateAsync: createTask }), useUpdateTask: () => ({ mutateAsync: vi.fn() }) }
})
vi.mock('../feedback/toastContext', async importOriginal => {
  const original = await importOriginal<typeof import('../feedback/toastContext')>()
  return { ...original, useToast: () => ({ showToast: toast }) }
})

beforeEach(() => {
  createProject.mockResolvedValue({ id: 'project-new' })
  createTask.mockResolvedValue({ id: 'task-new' })
})

it('normaliza los datos antes de crear un proyecto', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><ProjectForm /></MemoryRouter>)
  await user.type(screen.getByLabelText('Nombre del proyecto'), '  Portfolio Pro  ')
  await user.type(screen.getByLabelText('Descripción'), 'Mi caso de estudio')
  await user.selectOptions(screen.getByLabelText('Estado'), 'in_progress')
  await user.type(screen.getByLabelText('Tecnologías'), 'React, TypeScript, Supabase')
  await user.type(screen.getByLabelText('Repositorio'), 'https://github.com/example/portfolio')
  await user.click(screen.getByRole('button', { name: /Crear proyecto/ }))
  await waitFor(() => expect(createProject).toHaveBeenCalledWith({
    userId: 'user-1',
    input: {
      name: 'Portfolio Pro', description: 'Mi caso de estudio', status: 'in_progress',
      technologies: ['React', 'TypeScript', 'Supabase'], repository_url: 'https://github.com/example/portfolio', live_url: null,
    },
  }))
  expect(toast).toHaveBeenCalledWith('Proyecto creado correctamente.')
})

it('crea una tarea con prioridad y fecha límite', async () => {
  const user = userEvent.setup()
  const close = vi.fn()
  render(<TaskForm projectId="project-1" onClose={close} />)
  await user.type(screen.getByLabelText('Título'), 'Preparar demo final')
  await user.type(screen.getByLabelText('Descripción'), 'Grabar el flujo principal')
  await user.selectOptions(screen.getByLabelText('Estado'), 'in_progress')
  await user.selectOptions(screen.getByLabelText('Prioridad'), 'high')
  await user.type(screen.getByLabelText('Fecha límite'), '2026-08-30')
  await user.click(screen.getByRole('button', { name: /Guardar tarea/ }))
  await waitFor(() => expect(createTask).toHaveBeenCalledWith({
    projectId: 'project-1',
    input: { title: 'Preparar demo final', description: 'Grabar el flujo principal', status: 'in_progress', priority: 'high', due_date: '2026-08-30' },
  }))
  expect(close).toHaveBeenCalled()
})
