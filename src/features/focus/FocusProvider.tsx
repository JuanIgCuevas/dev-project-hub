import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { FocusContext } from './focusContext'
import type { FocusSession, StartFocusInput } from './focusContext'

const storageKey = 'devhub-focus-session'

function loadSession(): FocusSession | null {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as FocusSession | null
    if (!stored) return null
    return { ...stored, id: stored.id ?? crypto.randomUUID(), completedAt: stored.completedAt ?? null, completionReason: stored.completionReason ?? null }
  }
  catch { return null }
}

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [storedSession, setStoredSession] = useState<FocusSession | null>(loadSession)
  const [now, setNow] = useState(Date.now())
  const session = storedSession?.userId === user?.id ? storedSession : null
  const remainingSeconds = session?.status === 'running' && session.endAt
    ? Math.max(0, Math.ceil((session.endAt - now) / 1000))
    : session?.remainingSeconds ?? 0

  const saveSession = (next: FocusSession | null) => {
    setStoredSession(next)
    if (next) localStorage.setItem(storageKey, JSON.stringify(next))
    else localStorage.removeItem(storageKey)
  }

  useEffect(() => {
    if (session?.status !== 'running' || !session.endAt) return
    const timer = window.setInterval(() => {
      const currentTime = Date.now()
      setNow(currentTime)
      if (currentTime >= session.endAt!) {
        const completed = { ...session, status: 'completed' as const, remainingSeconds: 0, endAt: null, completedAt: currentTime, completionReason: 'timer' as const }
        setStoredSession(completed)
        localStorage.setItem(storageKey, JSON.stringify(completed))
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [session])

  const startSession = (input: StartFocusInput) => {
    const durationSeconds = Math.max(60, input.durationMinutes * 60)
    const startedAt = Date.now()
    saveSession({ id: crypto.randomUUID(), ...input, taskIds: input.tasks.map(task => task.id), taskTitles: input.tasks.map(task => task.title), durationSeconds, remainingSeconds: durationSeconds, startedAt, endAt: startedAt + durationSeconds * 1000, completedAt: null, completionReason: null, status: 'running' })
    setNow(startedAt)
  }
  const pauseSession = () => {
    if (!session || session.status !== 'running') return
    saveSession({ ...session, remainingSeconds, endAt: null, status: 'paused' })
  }
  const resumeSession = () => {
    if (!session || session.status !== 'paused') return
    const resumedAt = Date.now()
    saveSession({ ...session, endAt: resumedAt + session.remainingSeconds * 1000, status: 'running' })
    setNow(resumedAt)
  }
  const completeSession = () => {
    if (!session) return
    const completed = { ...session, status: 'completed' as const, remainingSeconds, endAt: null, completedAt: Date.now(), completionReason: 'manual' as const }
    saveSession(completed)
  }

  return <FocusContext.Provider value={{ session, remainingSeconds, startSession, pauseSession, resumeSession, completeSession, clearSession: () => saveSession(null) }}>{children}</FocusContext.Provider>
}
