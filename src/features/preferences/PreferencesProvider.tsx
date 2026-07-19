import { useState } from 'react'
import { defaultPreferences, PreferencesContext } from './preferencesContext'
import type { AppPreferences } from './preferencesContext'

function getInitialPreferences(): AppPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem('devhub-preferences') ?? '{}') as Partial<AppPreferences>
    return { ...defaultPreferences, ...saved }
  } catch {
    return defaultPreferences
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(getInitialPreferences)

  const updatePreference = <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => {
    setPreferences(current => {
      const next = { ...current, [key]: value }
      localStorage.setItem('devhub-preferences', JSON.stringify(next))
      return next
    })
  }

  return <PreferencesContext.Provider value={{ preferences, updatePreference }}>{children}</PreferencesContext.Provider>
}
