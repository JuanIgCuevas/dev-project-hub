import { ArrowRight, Check, Code2, FolderKanban, Languages, LayoutDashboard, Lightbulb, ListTodo, Moon, Play, Rocket, Sparkles, Sun, Target, Timer, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../feedback/toastContext'
import { usePreferences } from '../preferences/preferencesContext'
import { useTheme } from '../theme/themeContext'

type DemoView = 'home' | 'projects' | 'tasks' | 'ideas'

const projects = [
  { name: 'Portfolio 2026', description: 'Portfolio personal enfocado en producto, proceso y resultados.', status: 'En progreso', progress: 72, stack: ['React', 'TypeScript', 'Vercel'] },
  { name: 'FocusFlow', description: 'Sistema de sesiones profundas para developers independientes.', status: 'En progreso', progress: 48, stack: ['React', 'Supabase', 'PWA'] },
  { name: 'API Playground', description: 'Laboratorio para documentar y probar integraciones.', status: 'Idea', progress: 18, stack: ['Node.js', 'OpenAPI'] },
]

const initialTasks = [
  { id: 1, title: 'Publicar la nueva sección de casos', project: 'Portfolio 2026', priority: 'Alta', done: false },
  { id: 2, title: 'Probar recuperación de contraseña', project: 'FocusFlow', priority: 'Media', done: false },
  { id: 3, title: 'Optimizar imágenes del landing', project: 'Portfolio 2026', priority: 'Media', done: true },
  { id: 4, title: 'Definir endpoints iniciales', project: 'API Playground', priority: 'Baja', done: false },
]

const ideas = [
  { title: 'Release Notes visuales', description: 'Generar historias cortas a partir de commits y decisiones.', score: 88, stack: ['GitHub', 'IA'] },
  { title: 'Mapa de aprendizaje', description: 'Relacionar proyectos terminados con habilidades adquiridas.', score: 76, stack: ['React', 'D3'] },
  { title: 'Retro semanal', description: 'Un cierre simple con logros, bloqueos y próximo paso.', score: 69, stack: ['Supabase'] },
]

export function DemoPage() {
  const [view, setView] = useState<DemoView>('home')
  const [tasks, setTasks] = useState(initialTasks)
  const [tourStep, setTourStep] = useState(0)
  const { theme, toggleTheme } = useTheme()
  const { preferences, updatePreference } = usePreferences()
  const { showToast } = useToast()
  const english = preferences.language === 'en'
  const completed = tasks.filter(task => task.done).length
  const progress = Math.round(completed / tasks.length * 100)
  const nav = [
    { id: 'home' as const, label: english ? 'Home' : 'Inicio', icon: LayoutDashboard },
    { id: 'projects' as const, label: english ? 'Projects' : 'Proyectos', icon: FolderKanban },
    { id: 'tasks' as const, label: english ? 'Tasks' : 'Tareas', icon: ListTodo },
    { id: 'ideas' as const, label: 'Ideas', icon: Lightbulb },
  ]
  const tour = [
    { title: 'Todo tu trabajo, en contexto', text: 'El inicio reúne prioridades, progreso y el próximo paso.' },
    { title: 'Proyectos que cuentan una historia', text: 'Cada proyecto conserva tareas, decisiones, Focus y aprendizajes.' },
    { title: 'Una vista clara de lo pendiente', text: 'Probá completar una tarea para ver el progreso de la demo.' },
    { title: 'Ideas antes de que se pierdan', text: 'Capturá, evaluá y convertí una idea en proyecto cuando esté lista.' },
  ]
  const visibleTitle = nav.find(item => item.id === view)?.label ?? 'Inicio'

  const toggleTask = (id: number) => {
    setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task))
    showToast('Demo actualizada. Los cambios no se guardan.')
  }
  const advanceTour = () => {
    const next = (tourStep + 1) % tour.length
    setTourStep(next)
    setView(nav[next].id)
  }

  return <div className="demo-page">
    <aside className="demo-sidebar"><Link className="brand" to="/demo"><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>INTERACTIVE DEMO</small></span></Link><nav>{nav.map(item => <button className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)} type="button" aria-current={view === item.id ? 'page' : undefined} key={item.id}><item.icon /><span>{item.label}</span></button>)}</nav><div className="demo-sidebar-bottom"><span><Sparkles /> MODO DEMO</span><small>Datos ficticios · nada se guarda</small><Link to="/login"><X /> Salir de la demo</Link></div></aside>
    <main className="demo-main">
      <header className="demo-topbar"><div><p className="eyebrow">{english ? 'INTERACTIVE DEMO' : 'DEMO INTERACTIVA'} · {visibleTitle.toUpperCase()}</p><h1>{view === 'home' ? 'Así se siente construir con foco' : visibleTitle}</h1></div><div className="demo-top-actions"><label><Languages /><select aria-label="Idioma de la aplicación" value={preferences.language} onChange={event => updatePreference('language', event.target.value as typeof preferences.language)}><option value="es">ES</option><option value="en">EN</option></select></label><button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'}>{theme === 'dark' ? <Sun /> : <Moon />}</button><Link className="button primary" to="/register">Crear mi espacio <ArrowRight /></Link></div></header>

      <section className="demo-tour" aria-live="polite"><span>{tourStep + 1}/4</span><div><strong>{tour[tourStep].title}</strong><p>{tour[tourStep].text}</p></div><div className="demo-tour-dots">{tour.map((_, index) => <button type="button" className={tourStep === index ? 'active' : ''} onClick={() => { setTourStep(index); setView(nav[index].id) }} aria-label={`Ver paso ${index + 1}`} key={index} />)}</div><button className="button" type="button" onClick={advanceTour}>{tourStep === tour.length - 1 ? 'Volver al inicio' : 'Siguiente'} <ArrowRight /></button></section>

      {view === 'home' && <><section className="demo-stats"><article><FolderKanban /><div><strong>3</strong><span>Proyectos activos</span></div></article><article><ListTodo /><div><strong>{tasks.length - completed}</strong><span>Tareas pendientes</span></div></article><article><Timer /><div><strong>145</strong><span>Minutos Focus esta semana</span></div></article><article><Lightbulb /><div><strong>3</strong><span>Ideas por evaluar</span></div></article></section><section className="demo-home-grid"><article className="demo-next"><p className="eyebrow"><Target /> TU PRÓXIMO PASO</p><h2 data-no-translate>{tasks.find(task => !task.done)?.title}</h2><p>Una tarea concreta para mantener el impulso en <strong data-no-translate>{tasks.find(task => !task.done)?.project}</strong>.</p><button className="button primary" type="button" onClick={() => setView('tasks')}><Play /> Empezar ahora</button></article><article className="demo-progress-card"><div><p className="eyebrow">PULSO GENERAL</p><strong>{progress}%</strong></div><div className="demo-ring" style={{ '--demo-progress': `${progress * 3.6}deg` } as React.CSSProperties}><span>{completed}/{tasks.length}</span></div><p>Completá una tarea de la demo para actualizar este indicador.</p></article></section><DemoProjects compact /></>}
      {view === 'projects' && <DemoProjects />}
      {view === 'tasks' && <section className="demo-task-panel"><header><div><p className="eyebrow">TODAS TUS TAREAS</p><h2>Un próximo paso para cada proyecto</h2></div><span>{completed}/{tasks.length} completadas</span></header><div>{tasks.map(task => <article className={task.done ? 'done' : ''} key={task.id}><button type="button" onClick={() => toggleTask(task.id)} aria-label={task.done ? `Reabrir ${task.title}` : `Completar ${task.title}`}>{task.done ? <Check /> : null}</button><div><strong data-no-translate>{task.title}</strong><span data-no-translate>{task.project}</span></div><em className={task.priority.toLowerCase()}>{task.priority}</em></article>)}</div></section>}
      {view === 'ideas' && <section className="demo-ideas"><header><div><p className="eyebrow">BANDEJA DE IDEAS</p><h2>Lo próximo todavía puede cambiar</h2></div><button className="button primary" type="button" onClick={() => showToast({ message: 'En una cuenta real podrías guardar una nueva idea acá.', tone: 'info' })}><Lightbulb /> Nueva idea</button></header><div>{ideas.map(idea => <article key={idea.title}><span><Lightbulb /></span><b>{idea.score}%</b><h3 data-no-translate>{idea.title}</h3><p data-no-translate>{idea.description}</p><div>{idea.stack.map(item => <small data-no-translate key={item}>{item}</small>)}</div><button type="button" onClick={() => showToast('Idea lista para convertirse en proyecto.')}><Rocket /> Convertir en proyecto</button></article>)}</div></section>}
      <footer className="demo-footer"><div><Code2 /><span><strong>¿Listo para probarlo con tus proyectos?</strong><small>Creá una cuenta gratis y empezá con tu primera idea.</small></span></div><Link className="button primary" to="/register">Crear mi espacio <ArrowRight /></Link></footer>
    </main>
  </div>
}

function DemoProjects({ compact = false }: { compact?: boolean }) {
  return <section className={`demo-projects ${compact ? 'compact' : ''}`}><header><div><p className="eyebrow">PROYECTOS DESTACADOS</p><h2>{compact ? 'En qué estás construyendo' : 'Todos los proyectos en un solo lugar'}</h2></div>{compact && <span>Ver los 3 <ArrowRight /></span>}</header><div>{projects.map(project => <article key={project.name}><div><span><Code2 /></span><em>{project.status}</em></div><h3 data-no-translate>{project.name}</h3><p data-no-translate>{project.description}</p><div className="demo-stack">{project.stack.map(item => <small data-no-translate key={item}>{item}</small>)}</div><div className="demo-project-progress"><span><i style={{ width: `${project.progress}%` }} /></span><strong>{project.progress}%</strong></div></article>)}</div></section>
}
