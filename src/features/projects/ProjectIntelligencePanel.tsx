import { Activity, BookOpen, Check, CheckCircle2, ClipboardCheck, Copy, FileText, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { usePreferences } from '../preferences/preferencesContext'
import type { ProjectDetails } from './projectApi'
import { useAddProjectNote, useCreateDecision, useDeleteDecision, useProjectInsights, useUpdateShipChecklist } from './insightsApi'
import type { ShipChecks } from './insightsApi'

const manualChecks: { key: keyof ShipChecks; label: string }[] = [
  { key: 'readme', label: 'README completo' },
  { key: 'responsive', label: 'Diseño responsive revisado' },
  { key: 'security', label: 'Variables y permisos seguros' },
  { key: 'tests', label: 'Flujos principales probados' },
  { key: 'screenshots', label: 'Capturas preparadas' },
  { key: 'portfolio', label: 'Descripción para portfolio' },
]

export function ProjectIntelligencePanel({ project }: { project: ProjectDetails }) {
  const { preferences } = usePreferences()
  const isEnglish = preferences.language === 'en'
  const locale = isEnglish ? 'en-US' : 'es-AR'
  const { data: insights, isLoading } = useProjectInsights(project.id)
  const addNote = useAddProjectNote(project.id)
  const createDecision = useCreateDecision(project.id)
  const deleteDecision = useDeleteDecision(project.id)
  const updateChecklist = useUpdateShipChecklist(project.id)
  const [note, setNote] = useState('')
  const [decisionOpen, setDecisionOpen] = useState(false)
  const [decisionTitle, setDecisionTitle] = useState('')
  const [decisionContext, setDecisionContext] = useState('')
  const [decisionText, setDecisionText] = useState('')
  const [portfolioOpen, setPortfolioOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const checks: ShipChecks = { readme: false, responsive: false, security: false, tests: false, screenshots: false, portfolio: false, ...insights?.checklist }
  const automaticChecks = [
    { label: 'Descripción definida', done: Boolean(project.description) },
    { label: 'Stack tecnológico definido', done: project.technologies.length > 0 },
    { label: 'Repositorio conectado', done: Boolean(project.repository_url) },
    { label: 'Proyecto publicado', done: Boolean(project.live_url) },
  ]
  const completedChecks = automaticChecks.filter(item => item.done).length + manualChecks.filter(item => checks[item.key]).length
  const shipProgress = completedChecks * 10
  const completedTasks = project.tasks.filter(task => task.status === 'done').length
  const portfolioText = isEnglish
    ? `${project.name}\n\n${project.description || 'A personal project developed to solve a specific need.'}\n\nStack: ${project.technologies.join(', ') || 'Stack being defined'}.\n\nDevelopment: ${completedTasks} of ${project.tasks.length} planned tasks were completed.${insights?.decisions.length ? ` The main technical decisions include: ${insights.decisions.slice(0, 3).map(item => item.title).join(', ')}.` : ''}\n\nResult: ${project.live_url ? 'The project is published and available to try.' : 'The project documents the process, technical challenges, and lessons learned.'}`
    : `${project.name}\n\n${project.description || 'Proyecto personal desarrollado para resolver una necesidad concreta.'}\n\nStack: ${project.technologies.join(', ') || 'Stack en definición'}.\n\nDesarrollo: se completaron ${completedTasks} de ${project.tasks.length} tareas planificadas.${insights?.decisions.length ? ` Entre las decisiones técnicas principales se encuentran: ${insights.decisions.slice(0, 3).map(item => item.title).join(', ')}.` : ''}\n\nResultado: ${project.live_url ? 'El proyecto está publicado y disponible para probar.' : 'El proyecto documenta el proceso, los retos técnicos y los aprendizajes obtenidos.'}`

  const saveNote = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim()) return
    await addNote.mutateAsync(note.trim())
    setNote('')
  }
  const saveDecision = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!decisionTitle.trim() || !decisionText.trim()) return
    await createDecision.mutateAsync({ title: decisionTitle.trim(), context: decisionContext.trim(), decision: decisionText.trim() })
    setDecisionTitle(''); setDecisionContext(''); setDecisionText(''); setDecisionOpen(false)
  }
  const toggleCheck = (key: keyof ShipChecks) => updateChecklist.mutate({ ...checks, [key]: !checks[key] })
  const copyPortfolio = async () => {
    await navigator.clipboard.writeText(portfolioText)
    if (!checks.portfolio) updateChecklist.mutate({ ...checks, portfolio: true })
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (isLoading) return <div className="panel intelligence-loading"><span className="mini-loader" /> Preparando inteligencia del proyecto...</div>
  return <div className="project-intelligence"><section className="panel journal-panel"><div className="panel-head"><div><h2><Activity /> Diario de desarrollo</h2><p>Una memoria automática de cada avance.</p></div></div><form className="journal-composer" onSubmit={saveNote}><input value={note} onChange={event => setNote(event.target.value)} placeholder="Registrar un avance o aprendizaje..." /><button disabled={!note.trim() || addNote.isPending} aria-label="Agregar al diario"><Plus /></button></form><div className="timeline">{insights?.events.slice(0, 8).map(event => <article key={event.id}><i className={event.event_type} /><div><strong>{event.title}</strong><span>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.created_at))}</span></div></article>)}{!insights?.events.length && <p className="intelligence-empty">Los próximos cambios aparecerán automáticamente acá.</p>}</div></section><section className="panel decisions-panel"><div className="panel-head"><div><h2><BookOpen /> Decisiones técnicas</h2><p>Recordá por qué elegiste cada camino.</p></div><button className="button small" onClick={() => setDecisionOpen(true)}><Plus /> Nueva</button></div><div className="decision-list">{insights?.decisions.map(decision => <article key={decision.id}><div><strong data-no-translate>{decision.title}</strong><span data-no-translate>{decision.decision}</span>{decision.context && <small>Contexto: <span data-no-translate>{decision.context}</span></small>}</div><button className="icon-button danger-icon" onClick={() => deleteDecision.mutate(decision.id)} aria-label={`Eliminar ${decision.title}`}><Trash2 /></button></article>)}{!insights?.decisions.length && <p className="intelligence-empty">Documentá elecciones de arquitectura, librerías y alcance.</p>}</div></section><section className="panel ship-panel"><div className="ship-head"><div><h2><ClipboardCheck /> Ship Checklist</h2><p>Todo lo necesario para publicar con confianza.</p></div><strong>{shipProgress}%</strong></div><div className="ship-progress"><i style={{ width: `${shipProgress}%` }} /></div><div className="ship-checks">{automaticChecks.map(item => <div className={item.done ? 'done automatic' : 'automatic'} key={item.label}><span>{item.done && <Check />}</span>{item.label}<small>Automático</small></div>)}{manualChecks.map(item => <button className={checks[item.key] ? 'done' : ''} onClick={() => toggleCheck(item.key)} key={item.key}><span>{checks[item.key] && <Check />}</span>{item.label}</button>)}</div></section><section className="panel portfolio-panel"><span><FileText /></span><div><p className="eyebrow">PORTFOLIO AUTOMÁTICO</p><h2>Convertí el proceso en una historia</h2><p>Generá una presentación usando la descripción, el stack, las tareas y las decisiones del proyecto.</p><button className="button primary" onClick={() => setPortfolioOpen(true)}><Sparkles /> Generar texto</button></div></section>{decisionOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setDecisionOpen(false) }}><section className="task-modal decision-modal"><div className="modal-head"><div><p className="eyebrow">NUEVA DECISIÓN</p><h2>Documentar una elección</h2></div><button className="icon-button" onClick={() => setDecisionOpen(false)}><X /></button></div><form onSubmit={saveDecision}><label>Título<input value={decisionTitle} onChange={event => setDecisionTitle(event.target.value)} placeholder="Ej. Usar Supabase en lugar de API propia" /></label><label>Contexto<textarea rows={3} value={decisionContext} onChange={event => setDecisionContext(event.target.value)} placeholder="¿Qué problema o alternativas existían?" /></label><label>Decisión<textarea rows={4} value={decisionText} onChange={event => setDecisionText(event.target.value)} placeholder="¿Qué decidiste y por qué?" /></label><div className="form-actions"><button type="button" className="button" onClick={() => setDecisionOpen(false)}>Cancelar</button><button className="button primary" disabled={!decisionTitle.trim() || !decisionText.trim()}><CheckCircle2 /> Guardar decisión</button></div></form></section></div>}{portfolioOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setPortfolioOpen(false) }}><section className="task-modal portfolio-modal"><div className="modal-head"><div><p className="eyebrow">TEXTO PARA PORTFOLIO</p><h2 data-no-translate>{project.name}</h2></div><button className="icon-button" onClick={() => setPortfolioOpen(false)}><X /></button></div><pre data-no-translate>{portfolioText}</pre><div className="form-actions"><button className="button" onClick={() => setPortfolioOpen(false)}>Cerrar</button><button className="button primary" onClick={copyPortfolio}>{copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar texto'}</button></div></section></div>}</div>
}
