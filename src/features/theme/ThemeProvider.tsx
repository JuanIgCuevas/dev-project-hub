import { useEffect, useState } from 'react'
import { ThemeContext } from './themeContext'
import type { Theme } from './themeContext'

function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem('devhub-theme')
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('devhub-theme', theme)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme: () => setTheme(current => current === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>
}
