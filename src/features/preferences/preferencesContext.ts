import { createContext, useContext } from 'react'

export type DefaultPage = '/dashboard' | '/tasks' | '/ideas'
export type DefaultTaskView = 'list' | 'kanban'

export interface AppPreferences {
  defaultPage: DefaultPage
  defaultTaskView: DefaultTaskView
  assistantEnabled: boolean
  assistantSuggestions: boolean
  proactiveRecommendations: boolean
}

export interface PreferencesContextValue {
  preferences: AppPreferences
  updatePreference: <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => void
}

export const defaultPreferences: AppPreferences = {
  defaultPage: '/dashboard',
  defaultTaskView: 'list',
  assistantEnabled: true,
  assistantSuggestions: true,
  proactiveRecommendations: false,
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences debe usarse dentro de PreferencesProvider')
  return context
}
