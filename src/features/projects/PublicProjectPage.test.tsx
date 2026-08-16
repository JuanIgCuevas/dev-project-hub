import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import type { PublicProjectShowcase } from './projectApi'
import { PublicProjectPage } from './PublicProjectPage'

const publicQuery = vi.fn()
const updatePreference = vi.fn()
const toggleTheme = vi.fn()

vi.mock('./projectApi', async importOriginal => {
  const original = await importOriginal<typeof import('./projectApi')>()
  return { ...original, usePublicProject: (slug?: string) => publicQuery(slug) }
})
vi.mock('../preferences/preferencesContext', async importOriginal => {
  const original = await importOriginal<typeof import('../preferences/preferencesContext')>()
  return { ...original, usePreferences: () => ({ preferences: { language: 'es' }, updatePreference }) }
})
vi.mock('../theme/themeContext', async importOriginal => {
  const original = await importOriginal<typeof import('../theme/themeContext')>()
  return { ...original, useTheme: () => ({ theme: 'dark', toggleTheme }) }
})

const showcase: PublicProjectShowcase = {
  id: 'project-1', name: 'DevHub profesional', description: 'Un sistema para terminar proyectos.', status: 'in_progress',
  technologies: ['React', 'Supabase'], repository_url: 'https://github.com/example/devhub', live_url: 'https://example.com',
  public_slug: 'devhub-profesional', created_at: '2026-08-01T12:00:00Z', updated_at: '2026-08-16T12:00:00Z',
  published_at: '2026-08-16T12:00:00Z', owner_name: 'Juan', total_tasks: 3, completed_tasks: 2,
  milestones: [{ id: 'task-1', title: 'Preparar presentación' }],
}

function renderPage() {
  return render(<MemoryRouter initialEntries={['/showcase/devhub-profesional']}><Routes><Route path="/showcase/:slug" element={<PublicProjectPage />} /></Routes></MemoryRouter>)
}

beforeEach(() => publicQuery.mockReturnValue({ data: showcase, isLoading: false, error: null }))

it('muestra una presentación pública con progreso, stack e hitos', () => {
  renderPage()
  expect(screen.getByRole('heading', { name: 'DevHub profesional' })).toBeInTheDocument()
  expect(screen.getByText('67%')).toBeInTheDocument()
  expect(screen.getByText('React')).toBeInTheDocument()
  expect(screen.getByText('Preparar presentación')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver proyecto/ })).toHaveAttribute('href', 'https://example.com')
  expect(publicQuery).toHaveBeenCalledWith('devhub-profesional')
})

it('muestra un estado claro cuando el enlace no existe', () => {
  publicQuery.mockReturnValue({ data: null, isLoading: false, error: null })
  renderPage()
  expect(screen.getByRole('heading', { name: 'Este proyecto no está publicado' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Conocer DevHub/ })).toHaveAttribute('href', '/demo')
})
