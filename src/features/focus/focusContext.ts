import { createContext, useContext } from 'react'

export type FocusStatus = 'running' | 'paused' | 'completed'

export interface FocusSession {
  id: string
  userId: string
  projectId: string
  projectName: string
  taskIds: string[]
  taskTitles: string[]
  durationSeconds: number
  remainingSeconds: number
  startedAt: number
  endAt: number | null
  completedAt: number | null
  completionReason: 'timer' | 'manual' | null
  status: FocusStatus
}

export interface FocusSessionReflection {
  outcome: string
  pending: string
  nextStep: string
  rating: number | null
}

export interface StartFocusInput {
  userId: string
  projectId: string
  projectName: string
  tasks: { id: string; title: string }[]
  durationMinutes: number
}

export interface FocusContextValue {
  session: FocusSession | null
  remainingSeconds: number
  startSession: (input: StartFocusInput) => void
  pauseSession: () => void
  resumeSession: () => void
  completeSession: () => void
  clearSession: () => void
}

export const FocusContext = createContext<FocusContextValue | null>(null)

export function useFocus() {
  const context = useContext(FocusContext)
  if (!context) throw new Error('useFocus debe usarse dentro de FocusProvider')
  return context
}
