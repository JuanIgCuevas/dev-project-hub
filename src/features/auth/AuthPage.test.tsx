import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { AuthPage } from './AuthPage'

const signIn = vi.fn()

vi.mock('./AuthProvider', async importOriginal => {
  const original = await importOriginal<typeof import('./AuthProvider')>()
  return { ...original, useAuth: () => ({ signIn, signUp: vi.fn(), signOut: vi.fn(), user: null }) }
})

vi.mock('../preferences/preferencesContext', async importOriginal => {
  const original = await importOriginal<typeof import('../preferences/preferencesContext')>()
  return { ...original, usePreferences: () => ({ preferences: { language: 'es', defaultPage: '/dashboard' }, updatePreference: vi.fn() }) }
})

it('evita iniciar sesión cuando el email y la contraseña son inválidos', async () => {
  const user = userEvent.setup()
  render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>)
  await user.type(screen.getByLabelText('Email'), 'email-invalido')
  await user.type(screen.getByLabelText('Contraseña'), '123')
  await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))
  expect(await screen.findByText('Ingresá un email válido.')).toBeInTheDocument()
  expect(screen.getByText('Ingresá al menos 6 caracteres.')).toBeInTheDocument()
  expect(signIn).not.toHaveBeenCalled()
})
