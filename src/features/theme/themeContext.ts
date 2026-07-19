import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'system'

export type ThemeContextValue = {
  theme: Theme
  preference: ThemePreference
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider')
  return context
}
