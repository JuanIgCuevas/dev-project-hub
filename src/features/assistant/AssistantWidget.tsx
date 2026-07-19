import { Bot, ChevronLeft, ChevronRight, ExternalLink, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIdeas } from '../ideas/ideaApi'
import { useProjects } from '../projects/projectApi'
import type { ProjectWithTasks } from '../projects/projectApi'
import { useMyTasks } from '../tasks/taskApi'
import type { TaskOverview } from '../tasks/taskApi'
import { usePreferences } from '../preferences/preferencesContext'
import { getProjectPulse } from '../projects/projectHealth'

type AssistantMessage = {
  id: number
  role: 'assistant' | 'user'
  text: string
  link?: string
  linkLabel?: string
}

type AssistantAnswer = Pick<AssistantMessage, 'text' | 'link' | 'linkLabel'>

const suggestions = [
  '¿Qué proyecto debería continuar?',
  '¿Tengo tareas vencidas?',
  'Mostrame las tareas prioritarias',
  '¿Qué ideas tengo pendientes?',
]

function getFollowUpSuggestions(question: string) {
  const query = normalize(question)
  if (/vencid|atrasad|fuera de fecha/.test(query)) return ['Mostrame las tareas prioritarias', '¿Qué proyecto debería continuar?', 'Dame un resumen general']
  if (/prioridad|prioritari|urgente|importante/.test(query)) return ['¿Tengo tareas vencidas?', '¿Qué proyecto debería continuar?', '¿Cuántas tareas tengo pendientes?']
  if (/idea/.test(query)) return ['¿Qué proyecto debería continuar?', '¿Tengo proyectos pausados?', 'Dame un resumen general']
  if (/pausad/.test(query)) return ['¿Qué proyecto debería continuar?', '¿Tengo tareas vencidas?', '¿Qué ideas tengo pendientes?']
  if (/pulse|salud|ritmo|abandon|rescate/.test(query)) return ['Tengo 30 minutos, ¿qué hago?', '¿Tengo tareas vencidas?', 'Mostrame las tareas prioritarias']
  if (/30 min|media hora|60 min|una hora|1 hora|2 horas/.test(query)) return ['¿Cómo está el pulse de mis proyectos?', '¿Tengo tareas vencidas?', '¿Qué ideas tengo pendientes?']
  if (/proyecto|continuar|seguir|hoy|recomend/.test(query)) return ['¿Tengo tareas vencidas?', 'Mostrame las tareas prioritarias', '¿Qué ideas tengo pendientes?']
  if (/resumen|estado|como voy/.test(query)) return ['¿Qué proyecto debería continuar?', '¿Tengo tareas vencidas?', '¿Qué ideas tengo pendientes?']
  return suggestions
}

const initialMessage: AssistantMessage = {
  id: 1,
  role: 'assistant',
  text: '¡Hola! Soy el asistente de DevHub. Puedo ayudarte a decidir qué continuar y revisar tus proyectos, tareas e ideas.',
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function formatList(items: string[]) {
  return items.map(item => `• ${item}`).join('\n')
}

function getRecommendedProject(projects: ProjectWithTasks[], tasks: TaskOverview[]) {
  return projects
    .filter(project => project.status !== 'completed')
    .map(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id)
      const pending = projectTasks.filter(task => task.status !== 'done')
      const overdue = pending.filter(task => task.due_date && new Date(`${task.due_date}T23:59:59`) < new Date()).length
      const highPriority = pending.filter(task => task.priority === 'high').length
      const statusScore = project.status === 'in_progress' ? 5 : project.status === 'idea' ? 2 : -1
      return { project, pending: pending.length, score: statusScore + overdue * 3 + highPriority * 2 + Math.min(pending.length, 3) }
    })
    .sort((a, b) => b.score - a.score)[0]
}

export function AssistantWidget() {
  const { preferences } = usePreferences()
  const { data: projects = [], isLoading: loadingProjects } = useProjects()
  const { data: tasks = [], isLoading: loadingTasks } = useMyTasks()
  const { data: ideas = [], isLoading: loadingIdeas } = useIdeas()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AssistantMessage[]>([initialMessage])
  const [activeSuggestions, setActiveSuggestions] = useState(suggestions)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const loading = loadingProjects || loadingTasks || loadingIdeas

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    suggestionsRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }, [activeSuggestions])

  const answer = (question: string): AssistantAnswer => {
    const query = normalize(question)
    const pendingTasks = tasks.filter(task => task.status !== 'done')
    const overdueTasks = pendingTasks.filter(task => task.due_date && new Date(`${task.due_date}T23:59:59`) < new Date())
    const highPriorityTasks = pendingTasks.filter(task => task.priority === 'high')
    const pendingIdeas = ideas.filter(idea => idea.status !== 'archived' && !idea.converted_project_id)

    if (/hola|buenas|ayuda|que podes|qué podés/.test(query)) {
      return { text: 'Puedo recomendarte un proyecto, buscar tareas vencidas o prioritarias, resumir tus proyectos y revisar las ideas que todavía no convertiste.' }
    }
    if (/vencid|atrasad|fuera de fecha/.test(query)) {
      if (!overdueTasks.length) return { text: '¡Vas al día! No tenés tareas vencidas.' }
      return { text: `Tenés ${overdueTasks.length} ${overdueTasks.length === 1 ? 'tarea vencida' : 'tareas vencidas'}:\n${formatList(overdueTasks.slice(0, 5).map(task => `${task.title} — ${task.project_name}`))}`, link: '/tasks', linkLabel: 'Revisar tareas' }
    }
    if (/prioridad|prioritari|urgente|importante/.test(query)) {
      if (!highPriorityTasks.length) return { text: 'No hay tareas pendientes con prioridad alta.' }
      return { text: `Estas son tus prioridades altas:\n${formatList(highPriorityTasks.slice(0, 5).map(task => `${task.title} — ${task.project_name}`))}`, link: '/tasks', linkLabel: 'Abrir Mis tareas' }
    }
    if (/idea/.test(query)) {
      if (!pendingIdeas.length) return { text: 'No tenés ideas pendientes. Podés anotar una nueva cuando aparezca.' , link: '/ideas', linkLabel: 'Abrir Ideas' }
      return { text: `Tenés ${pendingIdeas.length} ${pendingIdeas.length === 1 ? 'idea pendiente' : 'ideas pendientes'}:\n${formatList(pendingIdeas.slice(0, 5).map(idea => idea.title))}`, link: '/ideas', linkLabel: 'Revisar ideas' }
    }
    if (/pausad/.test(query)) {
      const paused = projects.filter(project => project.status === 'paused')
      if (!paused.length) return { text: 'No tenés proyectos pausados.' }
      return { text: `Proyectos pausados:\n${formatList(paused.map(project => project.name))}`, link: '/dashboard', linkLabel: 'Ver proyectos' }
    }
    if (/pulse|salud|ritmo|abandon|rescate/.test(query)) {
      const atRisk = projects.map(project => ({ project, pulse: getProjectPulse(project, tasks) })).filter(item => item.pulse.state === 'stale' || item.pulse.state === 'blocked' || item.pulse.state === 'slowing')
      if (!atRisk.length) return { text: 'Todos tus proyectos mantienen un buen ritmo.' }
      return { text: `Estos proyectos necesitan atención:\n${formatList(atRisk.slice(0, 5).map(item => `${item.project.name} — ${item.pulse.label} (${item.pulse.score}/100)`))}`, link: '/dashboard', linkLabel: 'Abrir Project Pulse' }
    }
    if (/30 min|media hora|60 min|una hora|1 hora|2 horas|120 min/.test(query)) {
      const recommendation = getRecommendedProject(projects, tasks)
      if (!recommendation) return { text: 'No encontré un proyecto activo para preparar una sesión.' }
      const count = /30 min|media hora/.test(query) ? 1 : /2 horas|120 min/.test(query) ? 3 : 2
      const selectedTasks = tasks.filter(task => task.project_id === recommendation.project.id && task.status !== 'done').slice(0, count)
      return { text: `Para esta sesión, enfocáte en “${recommendation.project.name}”${selectedTasks.length ? `:\n${formatList(selectedTasks.map(task => task.title))}` : '. Definí una tarea pequeña que deje un resultado visible.'}`, link: `/projects/${recommendation.project.id}`, linkLabel: 'Iniciar sesión Focus' }
    }
    if (/completad|terminad/.test(query) && /tarea/.test(query)) {
      const completed = tasks.filter(task => task.status === 'done').length
      return { text: `Completaste ${completed} de ${tasks.length} tareas en total.` , link: '/tasks', linkLabel: 'Ver tareas' }
    }
    if (/pendiente|por hacer/.test(query) && /tarea/.test(query)) {
      if (!pendingTasks.length) return { text: 'No tenés tareas pendientes. ¡Excelente trabajo!' }
      return { text: `Tenés ${pendingTasks.length} tareas pendientes entre todos tus proyectos. ${highPriorityTasks.length ? `${highPriorityTasks.length} son de prioridad alta.` : 'Ninguna tiene prioridad alta.'}`, link: '/tasks', linkLabel: 'Ver pendientes' }
    }
    if (/proyecto|continuar|seguir|hoy|recomend/.test(query)) {
      const recommendation = getRecommendedProject(projects, tasks)
      if (!recommendation) return { text: 'No encontré proyectos activos para recomendarte. Podés crear uno desde una idea.', link: '/ideas', linkLabel: 'Explorar ideas' }
      const reason = recommendation.pending
        ? `tiene ${recommendation.pending} ${recommendation.pending === 1 ? 'tarea pendiente' : 'tareas pendientes'} y es el que más atención necesita`
        : 'está activo y puede ser un buen lugar para definir el próximo paso'
      return { text: `Te recomiendo continuar con “${recommendation.project.name}”: ${reason}.`, link: `/projects/${recommendation.project.id}`, linkLabel: 'Abrir proyecto' }
    }
    if (/resumen|estado|como voy|cómo voy/.test(query)) {
      const active = projects.filter(project => project.status === 'in_progress').length
      return { text: `Tu espacio tiene ${projects.length} proyectos, ${active} en progreso, ${pendingTasks.length} tareas pendientes y ${pendingIdeas.length} ideas por evaluar.` }
    }
    return { text: 'Todavía no entendí esa consulta. Probá preguntándome qué proyecto continuar, si tenés tareas vencidas, cuáles son prioritarias o qué ideas están pendientes.' }
  }

  const toggleAssistant = () => {
    const nextOpen = !open
    if (nextOpen && preferences.proactiveRecommendations && messages.length === 1 && !loading) {
      const proactiveQuestion = '¿Qué proyecto debería continuar?'
      const response = answer(proactiveQuestion)
      setMessages(current => [...current, { id: Date.now(), role: 'assistant', text: `Recomendación para hoy:\n${response.text}`, link: response.link, linkLabel: response.linkLabel }])
      setActiveSuggestions(getFollowUpSuggestions(proactiveQuestion))
    }
    setOpen(nextOpen)
  }

  const send = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return
    const id = Date.now()
    setMessages(current => [...current, { id, role: 'user', text: trimmed }])
    setActiveSuggestions(getFollowUpSuggestions(trimmed))
    setInput('')
    const response = loading ? { text: 'Todavía estoy cargando tu información. Probá nuevamente en un momento.' } : answer(trimmed)
    window.setTimeout(() => setMessages(current => [...current, { id: id + 1, role: 'assistant', ...response }]), 180)
  }

  const resetConversation = () => {
    setMessages([initialMessage])
    setActiveSuggestions(suggestions)
  }

  const scrollSuggestions = (direction: -1 | 1) => {
    suggestionsRef.current?.scrollBy({ left: direction * 210, behavior: 'smooth' })
  }

  return <><button className={`assistant-launcher ${open ? 'open' : ''}`} type="button" onClick={toggleAssistant} aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}>{open ? <X /> : <><Sparkles className="assistant-spark" /><Bot /></>}</button>{open && <aside className="assistant-panel" aria-label="Asistente de DevHub"><header><span><Bot /></span><div><strong>Asistente DevHub</strong><small><i /> Sin servicios de IA externos</small></div><button type="button" onClick={resetConversation} aria-label="Limpiar conversación" title="Limpiar conversación"><RotateCcw /></button></header><div className="assistant-messages">{messages.map(message => <div className={`assistant-message ${message.role}`} key={message.id}><span>{message.text}</span>{message.link && <Link to={message.link} onClick={() => setOpen(false)}>{message.linkLabel}<ExternalLink size={13} /></Link>}</div>)}<div ref={messagesEndRef} /></div>{preferences.assistantSuggestions && <div className="assistant-suggestion-row"><button className="suggestion-scroll" type="button" onClick={() => scrollSuggestions(-1)} aria-label="Ver sugerencias anteriores"><ChevronLeft /></button><div className="assistant-suggestions" ref={suggestionsRef}>{activeSuggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}</div><button className="suggestion-scroll" type="button" onClick={() => scrollSuggestions(1)} aria-label="Ver más sugerencias"><ChevronRight /></button></div>}<form className="assistant-input" onSubmit={event => { event.preventDefault(); send(input) }}><input value={input} onChange={event => setInput(event.target.value)} placeholder="Preguntá sobre tu trabajo..." aria-label="Mensaje para el asistente" /><button type="submit" disabled={!input.trim()} aria-label="Enviar"><Send /></button></form></aside>}</>
}
