import axe from 'axe-core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

vi.mock('./AuthProvider', async importOriginal => {
  const original = await importOriginal<typeof import('./AuthProvider')>()
  return {
    ...original,
    useAuth: () => ({ signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), user: null }),
  }
})

vi.mock('../preferences/preferencesContext', async importOriginal => {
  const original = await importOriginal<typeof import('../preferences/preferencesContext')>()
  return { ...original, usePreferences: () => ({ preferences: { language: 'es' }, updatePreference: vi.fn() }) }
})

it('mantiene el acceso libre de violaciones de accesibilidad detectables', async () => {
  const { container } = render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>)
  const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })

  expect(results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map(node => node.target),
  }))).toEqual([])
})
