import { Check, Clock3, Target } from 'lucide-react'
import { usePreferences } from '../preferences/preferencesContext'
import { useMyFocusSessions } from './focusApi'

export function FocusDailyGoal() {
  const { preferences } = usePreferences()
  const { data: sessions = [] } = useMyFocusSessions()
  const today = new Date().toDateString()
  const focusedMinutes = Math.round(sessions.filter(session => new Date(session.completed_at).toDateString() === today).reduce((total, session) => total + session.focused_seconds, 0) / 60)
  const goal = preferences.focusDailyGoalMinutes
  const progress = Math.min(100, Math.round(focusedMinutes / goal * 100))
  const achieved = focusedMinutes >= goal

  return <section className={`focus-daily-goal ${achieved ? 'achieved' : ''}`}><span>{achieved ? <Check /> : <Target />}</span><div><strong>{achieved ? 'Objetivo Focus cumplido' : 'Objetivo Focus de hoy'}</strong><small>{focusedMinutes} de {goal} minutos enfocados</small></div><div className="focus-daily-progress"><i style={{ width: `${progress}%` }} /></div><b><Clock3 /> {progress}%</b></section>
}
