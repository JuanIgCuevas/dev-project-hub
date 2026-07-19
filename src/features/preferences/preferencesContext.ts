import { createContext, useContext } from 'react'

export type DefaultPage = '/dashboard' | '/projects' | '/tasks' | '/ideas'
export type DefaultTaskView = 'list' | 'kanban'
export type FocusTimerPosition = 'top-right' | 'top-left' | 'bottom-left'

export interface AppPreferences {
  defaultPage: DefaultPage
  defaultTaskView: DefaultTaskView
  assistantEnabled: boolean
  assistantSuggestions: boolean
  proactiveRecommendations: boolean
  focusDefaultMinutes: number
  focusTimerPosition: FocusTimerPosition
  focusStartMinimized: boolean
  focusSoundEnabled: boolean
  focusDailyGoalMinutes: number
  focusConfirmDiscard: boolean
  assistantUseFocusHistory: boolean
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
  focusDefaultMinutes: 60,
  focusTimerPosition: 'top-right',
  focusStartMinimized: false,
  focusSoundEnabled: true,
  focusDailyGoalMinutes: 60,
  focusConfirmDiscard: true,
  assistantUseFocusHistory: true,
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) throw new Error('usePreferences debe usarse dentro de PreferencesProvider')
  return context
}
