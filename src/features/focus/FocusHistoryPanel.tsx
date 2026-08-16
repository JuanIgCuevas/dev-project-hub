import { CheckCircle2, Clock3, History, Pencil, Save, Target, Trash2, TrendingUp, X } from 'lucide-react'
import { useState } from 'react'
import type { FocusSessionRecord } from '../../types/database'
import { usePreferences } from '../preferences/preferencesContext'
import { useDeleteFocusSession, useProjectFocusSessions, useUpdateFocusSession } from './focusApi'

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`
}

export function FocusHistoryPanel({ projectId }: { projectId: string }) {
  const { preferences } = usePreferences()
  const locale = preferences.language === 'en' ? 'en-US' : 'es-AR'
  const { data: sessions = [], isLoading } = useProjectFocusSessions(projectId)
  const updateSession = useUpdateFocusSession(projectId)
  const deleteSession = useDeleteFocusSession(projectId)
  const [editing, setEditing] = useState<FocusSessionRecord | null>(null)
  const [objectives, setObjectives] = useState('')
  const [outcome, setOutcome] = useState('')
  const [pending, setPending] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [editError, setEditError] = useState('')
  const totalSeconds = sessions.reduce((total, session) => total + session.focused_seconds, 0)
  const averageSeconds = sessions.length ? totalSeconds / sessions.length : 0

  const openEditor = (session: FocusSessionRecord) => {
    setEditing(session)
    setObjectives(session.task_titles.join('\n'))
    setOutcome(session.outcome ?? '')
    setPending(session.pending ?? '')
    setNextStep(session.next_step ?? '')
    setRating(session.rating)
    setEditError('')
  }
  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setEditError('')
    try {
      await updateSession.mutateAsync({ id: editing.id, input: { taskTitles: objectives.split('\n').map(value => value.trim()).filter(Boolean), outcome: outcome.trim(), pending: pending.trim(), nextStep: nextStep.trim(), rating } })
      setEditing(null)
    } catch { setEditError('No pudimos modificar la sesión.') }
  }
  const removeSession = async (session: FocusSessionRecord) => {
    if (!window.confirm('¿Eliminar esta sesión Focus del historial? Esta acción no se puede deshacer.')) return
    await deleteSession.mutateAsync(session.id)
  }

  return <section className="panel focus-history-panel"><div className="panel-head"><div><h2><History /> Historial Focus</h2><p>Tiempo invertido y resultados concretos de cada sesión.</p></div>{sessions.length > 0 && <span className="focus-history-total"><Clock3 /> {formatDuration(totalSeconds)}</span>}</div>{isLoading ? <div className="intelligence-loading"><span className="mini-loader" /> Cargando sesiones...</div> : sessions.length ? <><div className="focus-history-stats"><div><span><Clock3 /></span><strong>{formatDuration(totalSeconds)}</strong><small>Tiempo enfocado</small></div><div><span><Target /></span><strong>{sessions.length}</strong><small>Sesiones guardadas</small></div><div><span><TrendingUp /></span><strong>{formatDuration(averageSeconds)}</strong><small>Promedio por sesión</small></div></div><div className="focus-history-list">{sessions.slice(0, 8).map(session => <article key={session.id}><header><div><strong>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(session.completed_at))}</strong><span>{formatDuration(session.focused_seconds)} de {formatDuration(session.planned_seconds)} · {session.completion_reason === 'timer' ? 'Tiempo cumplido' : 'Finalizada manualmente'}</span></div><div className="focus-history-card-actions">{session.rating && <b title="Valoración de la sesión">{session.rating}/5</b>}<button onClick={() => openEditor(session)} aria-label="Editar sesión" title="Editar"><Pencil /></button><button className="danger" onClick={() => removeSession(session)} disabled={deleteSession.isPending} aria-label="Eliminar sesión" title="Eliminar"><Trash2 /></button></div></header>{session.task_titles.length > 0 && <div className="focus-history-tasks">{session.task_titles.map((title, index) => <span key={`${session.id}-${index}`}><CheckCircle2 /> <span data-no-translate>{title}</span></span>)}</div>}<div className="focus-history-notes">{session.outcome && <p><strong>Resuelto</strong>{session.outcome}</p>}{session.pending && <p><strong>Pendiente</strong>{session.pending}</p>}{session.next_step && <p><strong>Próximo paso</strong>{session.next_step}</p>}{!session.outcome && !session.pending && !session.next_step && <p className="empty"><strong>Sesión registrada</strong>Sin notas de cierre.</p>}</div></article>)}</div></> : <div className="focus-history-empty"><Clock3 /><div><strong>Todavía no hay sesiones guardadas</strong><span>Cuando completes un Focus y elijas guardarlo, aparecerá acá.</span></div></div>}{editing && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null) }}><section className="task-modal focus-edit-modal" role="dialog" aria-modal="true" aria-labelledby="focus-edit-title"><div className="modal-head"><div><p className="eyebrow">EDITAR SESIÓN FOCUS</p><h2 id="focus-edit-title">Actualizar el registro</h2></div><button className="icon-button" type="button" onClick={() => setEditing(null)} aria-label="Cerrar"><X /></button></div><form onSubmit={saveEdit}><label>Objetivos de la sesión<textarea rows={3} value={objectives} onChange={event => setObjectives(event.target.value)} placeholder="Un objetivo por línea" /></label><label>¿Qué resolviste?<textarea rows={3} value={outcome} onChange={event => setOutcome(event.target.value)} /></label><div className="form-row"><label>¿Qué quedó pendiente?<textarea rows={3} value={pending} onChange={event => setPending(event.target.value)} /></label><label>Próximo paso<textarea rows={3} value={nextStep} onChange={event => setNextStep(event.target.value)} /></label></div><div className="focus-edit-rating"><span>Valoración</span><div>{[1, 2, 3, 4, 5].map(value => <button type="button" className={rating === value ? 'selected' : ''} onClick={() => setRating(rating === value ? null : value)} key={value}>{value}</button>)}</div></div>{editError && <div className="form-message error">{editError}</div>}<div className="form-actions"><button type="button" className="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button primary" disabled={updateSession.isPending}><Save /> {updateSession.isPending ? 'Guardando...' : 'Guardar cambios'}</button></div></form></section></div>}</section>
}
