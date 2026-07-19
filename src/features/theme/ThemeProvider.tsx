import { useEffect, useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { ThemeContext } from './themeContext'
import type { Theme, ThemePreference } from './themeContext'

function getInitialTheme(): ThemePreference {
  const savedTheme = localStorage.getItem('devhub-theme')
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') return savedTheme
  return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const theme: Theme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('devhub-theme', preference)
  }, [preference, theme])

  const setTheme = (nextTheme: ThemePreference) => {
    const transitionDocument = document as Document & { startViewTransition?: (callback: () => void) => void }
    if (!transitionDocument.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPreference(nextTheme)
      return
    }
    transitionDocument.startViewTransition(() => flushSync(() => setPreference(nextTheme)))
  }

  return <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>
}
