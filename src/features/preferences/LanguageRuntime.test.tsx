import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { usePreferences } from './preferencesContext'
import { PreferencesProvider } from './PreferencesProvider'

function LanguageExample() {
  const { updatePreference } = usePreferences()
  return <><p>Este proyecto no está publicado</p><p>DEMO INTERACTIVA · INICIO</p><span>Ver los 3</span><span data-no-translate>Mi proyecto personal</span><button aria-label="Usar modo claro" onClick={() => updatePreference('language', 'en')}>Cambiar idioma</button></>
}

it('traduce la interfaz al inglés y conserva el contenido escrito por el usuario', async () => {
  render(<PreferencesProvider><LanguageExample /></PreferencesProvider>)
  fireEvent.click(screen.getByText('Cambiar idioma'))
  await waitFor(() => expect(screen.getByText('This project is not published')).toBeInTheDocument())
  expect(screen.getByText('INTERACTIVE DEMO · HOME')).toBeInTheDocument()
  expect(screen.getByText('View all 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Use light mode' })).toBeInTheDocument()
  expect(screen.getByText('Mi proyecto personal')).toBeInTheDocument()
})
