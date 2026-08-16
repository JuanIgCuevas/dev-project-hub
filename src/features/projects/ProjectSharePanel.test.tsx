import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import type { ProjectDetails } from './projectApi'
import { ProjectSharePanel } from './ProjectSharePanel'

const publicationMutation = vi.fn()
const toast = vi.fn()

vi.mock('./projectApi', async importOriginal => {
  const original = await importOriginal<typeof import('./projectApi')>()
  return { ...original, useUpdateProjectPublication: () => ({ mutateAsync: publicationMutation, isPending: false }) }
})

vi.mock('../feedback/toastContext', async importOriginal => {
  const original = await importOriginal<typeof import('../feedback/toastContext')>()
  return { ...original, useToast: () => ({ showToast: toast }) }
})

const privateProject: ProjectDetails = {
  id: 'project-1', user_id: 'user-1', name: 'Mi Página Única', description: 'Presentación profesional',
  status: 'in_progress', technologies: ['React'], repository_url: null, live_url: null,
  is_public: false, public_slug: null, published_at: null,
  created_at: '2026-08-01T12:00:00Z', updated_at: '2026-08-16T12:00:00Z', tasks: [],
}

beforeEach(() => publicationMutation.mockResolvedValue({ ...privateProject, is_public: true, public_slug: 'portfolio-2026' }))

it('explica la privacidad y permite activar un enlace personalizado', async () => {
  const user = userEvent.setup()
  render(<ProjectSharePanel project={privateProject} />)
  expect(screen.getByText(/Tus notas, decisiones y fechas permanecen privadas/)).toBeInTheDocument()
  const input = screen.getByRole('textbox', { name: 'Dirección pública del proyecto' })
  expect(input).toHaveValue('mi-pagina-unica')
  await user.clear(input)
  await user.type(input, 'portfolio-2026')
  await user.click(screen.getByRole('button', { name: /Activar página pública/ }))
  expect(publicationMutation).toHaveBeenCalledWith({ id: 'project-1', isPublic: true, slug: 'portfolio-2026' })
  expect(toast).toHaveBeenCalledWith('Página pública activada.')
})
