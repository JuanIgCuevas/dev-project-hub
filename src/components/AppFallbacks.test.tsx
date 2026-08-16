import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AppErrorBoundary, NotFoundPage } from './AppFallbacks'

vi.mock('../features/auth/AuthProvider', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../features/preferences/preferencesContext', () => ({
  usePreferences: () => ({ preferences: { language: 'es', defaultPage: '/dashboard' } }),
}))

it('ofrece salidas claras cuando una ruta no existe', () => {
  render(<MemoryRouter><NotFoundPage /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Esta página no está en el mapa.' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Ver demo interactiva/ })).toHaveAttribute('href', '/demo')
  expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
})

it('evita una pantalla blanca cuando falla una vista', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const BrokenView = () => { throw new Error('Test render failure') }
  render(<AppErrorBoundary><BrokenView /></AppErrorBoundary>)
  expect(screen.getByRole('heading', { name: 'No pudimos abrir esta vista.' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Intentar de nuevo/ })).toBeInTheDocument()
  consoleError.mockRestore()
})
