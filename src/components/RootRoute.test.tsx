import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { RootRoute } from './RootRoute'

const auth = vi.hoisted(() => ({ user: null as null | { id: string }, loading: false }))

vi.mock('../features/auth/AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('../features/preferences/preferencesContext', () => ({
  usePreferences: () => ({ preferences: { defaultPage: '/projects' } }),
}))

function renderRoot() {
  return render(<MemoryRouter initialEntries={['/']}><Routes>
    <Route path="/" element={<RootRoute />} />
    <Route path="/login" element={<h1>Acceso</h1>} />
    <Route path="/projects" element={<h1>Proyectos</h1>} />
  </Routes></MemoryRouter>)
}

beforeEach(() => { auth.user = null; auth.loading = false })

it('envía a las visitas nuevas al acceso', () => {
  renderRoot()
  expect(screen.getByRole('heading', { name: 'Acceso' })).toBeInTheDocument()
})

it('respeta la página de inicio de una sesión activa', () => {
  auth.user = { id: 'user-1' }
  renderRoot()
  expect(screen.getByRole('heading', { name: 'Proyectos' })).toBeInTheDocument()
})

it('muestra una espera mientras se recupera la sesión', () => {
  auth.loading = true
  renderRoot()
  expect(screen.getByText('Preparando tu espacio...')).toBeInTheDocument()
})
