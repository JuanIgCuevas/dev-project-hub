import axe from 'axe-core'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { DemoPage } from './DemoPage'

vi.mock('../preferences/preferencesContext', async importOriginal => {
  const original = await importOriginal<typeof import('../preferences/preferencesContext')>()
  return { ...original, usePreferences: () => ({ preferences: { language: 'es' }, updatePreference: vi.fn() }) }
})

vi.mock('../theme/themeContext', async importOriginal => {
  const original = await importOriginal<typeof import('../theme/themeContext')>()
  return { ...original, useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }) }
})

vi.mock('../feedback/toastContext', async importOriginal => {
  const original = await importOriginal<typeof import('../feedback/toastContext')>()
  return { ...original, useToast: () => ({ showToast: vi.fn() }) }
})

it('mantiene la demo libre de violaciones de accesibilidad detectables', async () => {
  const { container } = render(<MemoryRouter><DemoPage /></MemoryRouter>)
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
