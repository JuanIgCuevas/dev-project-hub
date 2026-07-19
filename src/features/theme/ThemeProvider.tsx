import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'
import type { Theme, ThemePreference } from './themeContext'

function getInitialTheme(): ThemePreference {
  const savedTheme = localStorage.getItem('devhub-theme')
  if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') return savedTheme
  return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setTheme] = useState<ThemePreference>(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(() => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const theme: Theme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('devhub-theme', preference)
  }, [preference, theme])

  return <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>
}
