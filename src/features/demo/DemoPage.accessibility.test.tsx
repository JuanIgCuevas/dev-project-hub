import axe from 'axe-core'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { PreferencesProvider } from '../preferences/PreferencesProvider'
import { DemoPage } from './DemoPage'

vi.mock('../theme/themeContext', async importOriginal => {
  const original = await importOriginal<typeof import('../theme/themeContext')>()
  return { ...original, useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }) }
})

vi.mock('../feedback/toastContext', async importOriginal => {
  const original = await importOriginal<typeof import('../feedback/toastContext')>()
  return { ...original, useToast: () => ({ showToast: vi.fn() }) }
})

const renderDemo = () => render(<MemoryRouter><PreferencesProvider><DemoPage /></PreferencesProvider></MemoryRouter>)

it('mantiene la demo libre de violaciones de accesibilidad detectables', async () => {
  const { container } = renderDemo()
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      'landmark-unique': { enabled: false },
    },
  })

  expect(results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map(node => node.target),
  }))).toEqual([])
})

it('mantiene en inglés los textos dinámicos de la vista de tareas', () => {
  renderDemo()

  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } })
  fireEvent.click(screen.getByRole('button', { name: 'Tasks' }))

  expect(screen.getByText('INTERACTIVE DEMO · TASKS')).toBeInTheDocument()
  expect(screen.getByText('1/4 completed')).toBeInTheDocument()
})
