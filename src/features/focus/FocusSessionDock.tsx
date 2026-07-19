import { Check, CircleStop, ExternalLink, Maximize2, Minimize2, Pause, Play, Save, Sparkles, Target, Timer, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreferences } from '../preferences/preferencesContext'
import { useSaveFocusReflection } from './focusApi'
import { useFocus } from './focusContext'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainder}`
}

export function FocusSessionDock() {
  const { session, remainingSeconds, pauseSession, resumeSession, completeSession, clearSession } = useFocus()
  const { preferences } = usePreferences()
  const saveReflection = useSaveFocusReflection()
  const initializedSessionId = useRef<string | null>(null)
  const [minimized, setMinimized] = useState(preferences.focusStartMinimized)
  const [outcome, setOutcome] = useState('')
  const [pending, setPending] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (session?.status === 'running' && initializedSessionId.current !== session.id) {
      initializedSessionId.current = session.id
      setMinimized(preferences.focusStartMinimized)
    }
  }, [preferences.focusStartMinimized, session?.id, session?.status])

  useEffect(() => {
    if (session?.status !== 'completed' || !preferences.focusSoundEnabled) return
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.frequency.setValueAtTime(660, context.currentTime)
      oscillator.frequency.setValueAtTime(880, context.currentTime + 0.16)
      gain.gain.setValueAtTime(0.09, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.38)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.4)
      oscillator.onended = () => void context.close()
    } catch { /* El aviso visual permanece disponible si el navegador bloquea audio. */ }
  }, [preferences.focusSoundEnabled, session?.id, session?.status])

  if (!session) return null
  const positionClass = `position-${preferences.focusTimerPosition}`
  const progress = session.status === 'completed' ? 100 : Math.min(100, Math.max(0, ((session.durationSeconds - remainingSeconds) / session.durationSeconds) * 100))
  const changeMinimized = (value: boolean) => {
    setMinimized(value)
    localStorage.setItem('devhub-focus-minimized', String(value))
  }
  const saveClosure = async () => {
    setSaveError('')
    try {
      await saveReflection.mutateAsync({ session, reflection: { outcome: outcome.trim(), pending: pending.trim(), nextStep: nextStep.trim(), rating } })
      clearSession()
    } catch { setSaveError('No pudimos guardar el cierre. Intentá nuevamente.') }
  }
  const discardSession = () => {
    if (preferences.focusConfirmDiscard && !window.confirm('¿Descartar esta sesión sin guardarla?')) return
    clearSession()
  }

  if (session.status === 'completed') {
    return <aside className={`focus-session-dock completed focus-reflection ${positionClass}`}>
      <div className="focus-session-success"><span><Check /></span><div><strong>¡Sesión completada!</strong><small>{session.projectName} · {Math.round((session.durationSeconds - session.remainingSeconds) / 60)} min enfocado</small></div></div>
      <div className="focus-reflection-intro"><Sparkles /><span>Elegí si querés guardar esta sesión. Podés sumar contexto ahora o editarlo después.</span></div>
      <label>¿Qué resolviste?<textarea rows={2} value={outcome} onChange={event => setOutcome(event.target.value)} placeholder="Ej. Terminé el login y corregí la validación..." /></label>
      <div className="focus-reflection-row"><label>¿Qué quedó pendiente?<input value={pending} onChange={event => setPending(event.target.value)} placeholder="Algo por revisar..." /></label><label>Próximo paso<input value={nextStep} onChange={event => setNextStep(event.target.value)} placeholder="Continuar con..." /></label></div>
      <div className="focus-rating"><span>¿Cómo rindió la sesión?</span><div>{[1, 2, 3, 4, 5].map(value => <button type="button" className={rating === value ? 'selected' : ''} onClick={() => setRating(value)} key={value}>{value}</button>)}</div></div>
      {saveError && <p className="focus-save-error">{saveError}</p>}
      <div className="focus-reflection-actions"><button type="button" className="discard" onClick={discardSession} disabled={saveReflection.isPending}><Trash2 /> No guardar</button><button type="button" onClick={saveClosure} disabled={saveReflection.isPending}><Save /> {saveReflection.isPending ? 'Guardando...' : 'Guardar sesión'}</button></div>
    </aside>
  }
  if (minimized) return <aside className={`focus-session-dock minimized ${session.status} ${positionClass}`}><Link to={`/projects/${session.projectId}`} title={`Ir a ${session.projectName}`}><strong>{formatTime(remainingSeconds)}</strong></Link><button type="button" onClick={() => changeMinimized(false)} aria-label="Expandir temporizador" title="Expandir"><Maximize2 /></button></aside>

  return <aside className={`focus-session-dock ${positionClass}`}>
    <button type="button" className="focus-dock-minimize" onClick={() => changeMinimized(true)} aria-label="Minimizar temporizador" title="Minimizar"><Minimize2 /></button>
    <div className="focus-dock-top"><div><span className={session.status}><i /> MODO FOCUS</span><Link to={`/projects/${session.projectId}`}>{session.projectName}</Link></div><strong><Timer /> {formatTime(remainingSeconds)}</strong></div>
    <div className="focus-dock-progress"><i style={{ width: `${progress}%` }} /></div>
    <div className="focus-dock-task"><Target /><span>{session.taskTitles[0] || 'Sesión libre'}{session.taskTitles.length > 1 && <small>+{session.taskTitles.length - 1} siguientes</small>}</span></div>
    <div className="focus-dock-actions"><Link to={`/projects/${session.projectId}`}><ExternalLink /> Ver proyecto</Link>{session.status === 'running' ? <button type="button" onClick={pauseSession}><Pause /> Pausar</button> : <button type="button" onClick={resumeSession}><Play /> Continuar</button>}<button type="button" className="finish" onClick={completeSession}><CircleStop /> Finalizar</button></div>
  </aside>
}
