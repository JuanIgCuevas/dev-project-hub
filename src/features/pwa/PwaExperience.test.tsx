import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PwaInstallCard } from './PwaExperience'
import { detectInstallPlatform } from './installPlatform'

vi.mock('../preferences/preferencesContext', () => ({
  usePreferences: () => ({ preferences: { language: 'es' } }),
}))

it('muestra la guía correspondiente y permite consultar otra plataforma', () => {
  render(<PwaInstallCard />)
  fireEvent.click(screen.getByRole('button', { name: /Android/ }))
  expect(screen.getByText('Navegador recomendado: Google Chrome.')).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /iPhone \/ iPad/ }))
  expect(screen.getByText('En dispositivos Apple, la instalación se realiza desde Safari.')).toBeInTheDocument()
  expect(screen.getByText(/Añadir a pantalla de inicio/)).toBeInTheDocument()
})

it('detecta Android, iOS y computadoras', () => {
  const userAgent = vi.spyOn(window.navigator, 'userAgent', 'get')
  userAgent.mockReturnValueOnce('Mozilla/5.0 (Linux; Android 14)')
  expect(detectInstallPlatform()).toBe('android')
  userAgent.mockReturnValueOnce('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')
  expect(detectInstallPlatform()).toBe('ios')
  userAgent.mockReturnValueOnce('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
  expect(detectInstallPlatform()).toBe('desktop')
})
