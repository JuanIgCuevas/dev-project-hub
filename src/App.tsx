import { Activity, ArrowRight, Bot, CalendarDays, CheckCircle2, Clock3, Code2, Columns3, Database, Download, ExternalLink, FolderKanban, Github, GripVertical, KeyRound, Languages, Laptop, LayoutDashboard, Lightbulb, ListTodo, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Rocket, Rows3, Save, Search, Settings as SettingsIcon, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Timer, Trash2, UserRound } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AssistantWidget } from './features/assistant/AssistantWidget'
import { useAuth } from './features/auth/AuthProvider'
import { useDeleteProject, useProject, useProjects } from './features/projects/projectApi'
import { FocusPanel } from './features/projects/FocusPanel'
import { getProjectPulse } from './features/projects/projectHealth'
import { FocusSessionDock } from './features/focus/FocusSessionDock'
import { FocusDailyGoal } from './features/focus/FocusDailyGoal'
import { useMyFocusSessions } from './features/focus/focusApi'
import { TaskForm } from './features/tasks/TaskForm'
import { useDeleteTask, useMyTasks, useUpdateTaskStatus } from './features/tasks/taskApi'
import { useIdeas } from './features/ideas/ideaApi'
import type { TaskOverview } from './features/tasks/taskApi'
import { supabase } from './lib/supabase'
import { useTheme } from './features/theme/themeContext'
import { usePreferences } from './features/preferences/preferencesContext'
import { OnboardingTour } from './features/onboarding/OnboardingTour'
import { onboardingStorageKey } from './features/onboarding/onboardingStorage'
import { ProjectRevivalMemory } from './features/revival/ProjectRevivalMemory'
import { RevivalDashboard } from './features/revival/RevivalDashboard'
import type { ProjectStatus, Task, TaskStatus } from './types/database'
import { EmptyState, PageSkeleton } from './components/UiStates'
import { useToast } from './features/feedback/toastContext'

const AuthPage = lazy(() => import('./features/auth/AuthPage').then(module => ({ default: module.AuthPage })))
const ForgotPasswordPage = lazy(() => import('./features/auth/PasswordPages').then(module => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./features/auth/PasswordPages').then(module => ({ default: module.ResetPasswordPage })))
const IdeasPage = lazy(() => import('./features/ideas/IdeasPage').then(module => ({ default: module.IdeasPage })))
const ProjectForm = lazy(() => import('./features/projects/ProjectForm').then(module => ({ default: module.ProjectForm })))
const ProjectIntelligencePanel = lazy(() => import('./features/projects/ProjectIntelligencePanel').then(module => ({ default: module.ProjectIntelligencePanel })))
const FocusHistoryPanel = lazy(() => import('./features/focus/FocusHistoryPanel').then(module => ({ default: module.FocusHistoryPanel })))
const DemoPage = lazy(() => import('./features/demo/DemoPage').then(module => ({ default: module.DemoPage })))
const PublicProjectPage = lazy(() => import('./features/projects/PublicProjectPage').then(module => ({ default: module.PublicProjectPage })))
const ProjectSharePanel = lazy(() => import('./features/projects/ProjectSharePanel').then(module => ({ default: module.ProjectSharePanel })))

const projectStatus: Record<ProjectStatus, { label: string; tone: string }> = {
  idea: { label: 'Idea', tone: 'violet' },
  in_progress: { label: 'En progreso', tone: 'green' },
  paused: { label: 'Pausado', tone: 'amber' },
  completed: { label: 'Terminado', tone: 'green' },
}

const taskColumns: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Pendiente' },
  { status: 'in_progress', label: 'En progreso' },
  { status: 'done', label: 'Completada' },
]

function relativeDate(value: string) {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  return `hace ${days} días`
}

function Brand() {
  const { preferences } = usePreferences()
  return <Link className="brand" to={preferences.defaultPage}><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>BUILD SYSTEM · 2026</small></span></Link>
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const projectsActive = location.pathname === '/projects' || location.pathname.startsWith('/projects/')
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const initials = username.slice(0, 2).toUpperCase()
  const { theme, toggleTheme } = useTheme()
  const handleSignOut = async () => {
    if (!window.confirm('¿Seguro que querés cerrar sesión?')) return
    await signOut()
    navigate('/login', { replace: true })
  }

  return <aside className="sidebar">
    <div className="sidebar-header"><Brand /><button className="sidebar-toggle" type="button" onClick={onToggle} aria-label={collapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'} title={collapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
    <nav>
      <Link className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} to="/dashboard" title="Inicio" aria-current={location.pathname === '/dashboard' ? 'page' : undefined}><LayoutDashboard size={18} /><span className="nav-label">Inicio</span></Link>
      <Link className={`nav-link ${projectsActive ? 'active' : ''}`} to="/projects" title="Proyectos" aria-current={projectsActive ? 'page' : undefined}><FolderKanban size={18} /><span className="nav-label">Proyectos</span></Link>
      <Link className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`} to="/tasks" title="Mis tareas" aria-current={location.pathname === '/tasks' ? 'page' : undefined}><ListTodo size={18} /><span className="nav-label">Tareas</span></Link>
      <Link className={`nav-link ${location.pathname === '/ideas' ? 'active' : ''}`} to="/ideas" title="Ideas" aria-current={location.pathname === '/ideas' ? 'page' : undefined}><Lightbulb size={18} /><span className="nav-label">Ideas</span></Link>
      <Link className={`nav-link mobile-settings-link ${location.pathname === '/settings' ? 'active' : ''}`} to="/settings" aria-label="Configuración" aria-current={location.pathname === '/settings' ? 'page' : undefined}><SettingsIcon size={18} /><span className="nav-label">Ajustes</span></Link>
      <button className="nav-link mobile-theme-toggle" type="button" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span className="nav-label">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span></button>
      <button className="nav-link mobile-logout" type="button" onClick={handleSignOut}><LogOut size={18} /><span className="nav-label">Salir</span></button>
    </nav>
    <div className="sidebar-bottom">
      <div className="account-row"><div className="user"><div className="avatar">{initials}</div><div><strong>{username}</strong></div></div><button className="account-settings quick-theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><Link className={`account-settings ${location.pathname === '/settings' ? 'active' : ''}`} to="/settings" aria-label="Configuración" title="Configuración"><SettingsIcon size={18} /></Link></div>
      <button className="logout" type="button" onClick={handleSignOut}><LogOut size={17} /><span className="logout-label">Cerrar sesión</span></button>
    </div>
  </aside>
}

function Shell({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences()
  const { user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('devhub-sidebar-collapsed') === 'true')
  const [showOnboarding, setShowOnboarding] = useState(() => Boolean(user && localStorage.getItem(onboardingStorageKey(user.id)) !== 'true'))
  const toggleSidebar = () => setSidebarCollapsed(current => {
    const next = !current
    localStorage.setItem('devhub-sidebar-collapsed', String(next))
    return next
  })
  const finishOnboarding = () => {
    if (user) localStorage.setItem(onboardingStorageKey(user.id), 'true')
    setShowOnboarding(false)
  }
  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}><a className="skip-link" href="#main-content">Saltar al contenido principal</a><Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} /><main className="main" id="main-content" tabIndex={-1}>{children}</main><FocusSessionDock />{preferences.assistantEnabled && <AssistantWidget />}{showOnboarding && <OnboardingTour onFinish={finishOnboarding} />}</div>
}

function Dashboard() {
  const { user } = useAuth()
  const { preferences } = usePreferences()
  const { data: projects = [] } = useProjects()
  const { data: dashboardTasks = [] } = useMyTasks()
  const { data: ideas = [] } = useIdeas()
  const { data: focusSessions = [] } = useMyFocusSessions()
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const locale = preferences.language === 'en' ? 'en-US' : 'es-AR'
  const today = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()
  const pendingTasks = dashboardTasks.filter(task => task.status !== 'done')
  const openIdeas = ideas.filter(idea => idea.status !== 'archived' && !idea.converted_project_id)
  const todayKey = new Date().toDateString()
  const weekStart = Date.now() - 7 * 86_400_000
  const todayFocusMinutes = Math.round(focusSessions.filter(session => new Date(session.completed_at).toDateString() === todayKey).reduce((total, session) => total + session.focused_seconds, 0) / 60)
  const weekFocusMinutes = Math.round(focusSessions.filter(session => new Date(session.completed_at).getTime() >= weekStart).reduce((total, session) => total + session.focused_seconds, 0) / 60)
  const nextTask = [...pendingTasks].sort((a, b) => {
    const aOverdue = a.due_date && new Date(`${a.due_date}T23:59:59`).getTime() < Date.now() ? 0 : 1
    const bOverdue = b.due_date && new Date(`${b.due_date}T23:59:59`).getTime() < Date.now() ? 0 : 1
    if (aOverdue !== bOverdue) return aOverdue - bOverdue
    const priority = { high: 0, medium: 1, low: 2 }
    return priority[a.priority] - priority[b.priority]
  })[0]
  const attentionProject = projects
    .filter(project => project.status !== 'completed')
    .map(project => ({ project, pulse: getProjectPulse(project, dashboardTasks) }))
    .sort((a, b) => a.pulse.score - b.pulse.score)[0]
  const recentSession = focusSessions[0]
  return <Shell>
    <header className="topbar dashboard-topbar"><div><p className="eyebrow">{today}</p><h1>Buenos días, {username} <span>👋</span></h1><p>Este es el pulso general de todo lo que estás construyendo.</p></div><Link className="button" to="/projects">Ver proyectos <ArrowRight size={17} /></Link></header>
    <div className="mobile-scroll-hint"><strong>Resumen rápido</strong><span>Deslizá para ver más <ArrowRight /></span></div>
    <section className="dashboard-summary" aria-label="Resumen general">
      <article className="summary-next-step">
        <div className="summary-card-head"><span><Rocket /></span><p className="eyebrow">TU PRÓXIMO PASO</p></div>
        {nextTask ? <><h2 data-no-translate>{nextTask.title}</h2><p>La prioridad más conveniente para continuar ahora está en <strong data-no-translate>{nextTask.project_name}</strong>.</p><div className="summary-meta"><span className={`priority ${nextTask.priority === 'high' ? 'alta' : nextTask.priority === 'low' ? 'baja' : 'media'}`}>{nextTask.priority === 'high' ? 'Alta prioridad' : nextTask.priority === 'low' ? 'Prioridad baja' : 'Prioridad media'}</span>{nextTask.due_date && <span><CalendarDays /> {new Intl.DateTimeFormat(locale).format(new Date(`${nextTask.due_date}T12:00:00`))}</span>}</div><Link to={`/projects/${nextTask.project_id}`}>Abrir proyecto <ArrowRight /></Link></> : <><h2>Todo al día</h2><p>No tenés tareas pendientes. Podés capturar una idea o preparar el siguiente proyecto.</p><Link to="/ideas">Abrir ideas <ArrowRight /></Link></>}
      </article>
      <article className="summary-focus-card">
        <div className="summary-card-head"><span><Timer /></span><p className="eyebrow">FOCUS</p></div>
        <div className="summary-focus-metrics"><div><strong>{todayFocusMinutes}</strong><span>min hoy</span></div><div><strong>{weekFocusMinutes}</strong><span>min esta semana</span></div></div>
        <p>{recentSession ? <>Última sesión en <strong>{recentSession.project_name}</strong>{recentSession.outcome ? `: ${recentSession.outcome}` : '.'}</> : 'Todavía no guardaste sesiones. Tu historial empezará con el próximo Focus.'}</p>
        {recentSession && <Link to={`/projects/${recentSession.project_id}`}>Ver último avance <ArrowRight /></Link>}
      </article>
      <article className="summary-pulse-card">
        <div className="summary-card-head"><span><Activity /></span><p className="eyebrow">PROJECT PULSE</p></div>
        {attentionProject ? <><div className="summary-pulse-score"><strong>{attentionProject.pulse.score}</strong><span><b>{attentionProject.project.name}</b>{attentionProject.pulse.label}</span></div><p>Es el proyecto que más atención necesita en este momento.</p><Link to={`/projects/${attentionProject.project.id}`}>Revisar proyecto <ArrowRight /></Link></> : <><h2>Espacio nuevo</h2><p>Creá tu primer proyecto para empezar a medir su progreso.</p><Link to="/projects/new">Crear proyecto <ArrowRight /></Link></>}
      </article>
    </section>
    <section className="stats overview-stats">
      <article><span className="stat-icon blue"><FolderKanban /></span><div><strong>{projects.filter(project => project.status === 'in_progress').length}</strong><p>Proyectos activos</p></div></article>
      <article><span className="stat-icon green"><ListTodo /></span><div><strong>{pendingTasks.length}</strong><p>Tareas pendientes</p></div></article>
      <article><span className="stat-icon violet"><Lightbulb /></span><div><strong>{openIdeas.length}</strong><p>Ideas por evaluar</p></div></article>
      <article><span className="stat-icon amber"><Clock3 /></span><div><strong>{todayFocusMinutes}</strong><p>Minutos Focus hoy</p></div></article>
    </section>
    <FocusDailyGoal />
    <RevivalDashboard projects={projects} tasks={dashboardTasks} sessions={focusSessions} />
    <FocusPanel projects={projects} tasks={dashboardTasks} />
  </Shell>
}

function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  const { data: tasks = [] } = useMyTasks()
  const [search, setSearch] = useState('')
  const visibleProjects = projects.filter(project => project.name.toLowerCase().includes(search.trim().toLowerCase()))
  const completedTasks = projects.reduce((total, project) => total + project.tasks.filter(task => task.status === 'done').length, 0)

  return <Shell><div className="projects-page">
    <header className="projects-heading"><div><p className="eyebrow">TU ESPACIO DE TRABAJO</p><h1>Proyectos</h1><p>Creá, buscá y administrá todo lo que estás construyendo.</p></div><Link className="button primary" to="/projects/new"><Plus size={18} /> Nuevo proyecto</Link></header>
    <section className="stats projects-stats" aria-label="Resumen de proyectos">
      <article><span className="stat-icon blue"><FolderKanban /></span><div><strong>{projects.length}</strong><p>Proyectos totales</p></div></article>
      <article><span className="stat-icon green"><Rocket /></span><div><strong>{projects.filter(project => project.status === 'in_progress').length}</strong><p>En progreso</p></div></article>
      <article><span className="stat-icon amber"><Timer /></span><div><strong>{projects.filter(project => project.status === 'paused').length}</strong><p>Pausados</p></div></article>
      <article><span className="stat-icon violet"><CheckCircle2 /></span><div><strong>{completedTasks}</strong><p>Tareas completadas</p></div></article>
    </section>
    <section className="section-head projects-section-head"><div><h2>Todos tus proyectos</h2><p>{visibleProjects.length} {visibleProjects.length === 1 ? 'proyecto visible' : 'proyectos visibles'}.</p></div><label className="search"><Search size={17} /><input aria-label="Buscar proyectos" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar proyecto..." /></label></section>
    {isLoading && <PageSkeleton label="Cargando proyectos..." />}
    {error && <div className="content-state error-state"><p>No pudimos cargar tus proyectos.</p></div>}
    <section className="project-grid projects-page-grid">
      {visibleProjects.map(project => {
        const done = project.tasks.filter(task => task.status === 'done').length
        const total = project.tasks.length
        const status = projectStatus[project.status]
        const pulse = getProjectPulse(project, tasks)
        return <Link to={`/projects/${project.id}`} className="project-card" key={project.id}>
          <div className="card-top"><span className={`project-symbol ${status.tone}`}><Code2 /></span><span className={`badge ${status.tone}`}><i />{status.label}</span></div>
          <div className={`project-pulse ${pulse.state}`}><i /><span>{pulse.label}</span><strong>{pulse.score}</strong></div>
          <h3 data-no-translate>{project.name}</h3><p data-no-translate={project.description ? true : undefined}>{project.description || 'Sin descripción todavía.'}</p>
          <div className="tech-list">{project.technologies.length ? project.technologies.map(item => <span data-no-translate key={item}>{item}</span>) : <span>Stack por definir</span>}</div>
          <div className="progress-label"><span>Progreso</span><strong>{done}/{total} tareas</strong></div>
          <div className="progress"><i style={{ width: `${total ? done / total * 100 : 0}%` }} /></div>
          <div className="card-footer"><span>Actualizado {relativeDate(project.updated_at)}</span><ArrowRight size={18} /></div>
        </Link>
      })}
      {!isLoading && !error && search && visibleProjects.length === 0 && <div className="empty-search"><p>No encontramos proyectos con “{search}”.</p></div>}
      {!isLoading && !error && !search && projects.length === 0 && <EmptyState title="Tu primer proyecto empieza acá" description="Creá un espacio para organizar tareas, decisiones y avances." action={<Link className="button primary" to="/projects/new">Crear proyecto</Link>} />}
      <Link to="/projects/new" className="new-card"><span><Plus /></span><strong>Crear nuevo proyecto</strong><p>Convertí esa idea en algo real.</p></Link>
    </section>
  </div></Shell>
}

function ProjectPage() {
  const { projectId } = useParams()
  const { preferences } = usePreferences()
  const locale = preferences.language === 'en' ? 'en-US' : 'es-AR'
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const { showToast } = useToast()
  const deleteTask = useDeleteTask()
  const updateTaskStatus = useUpdateTaskStatus()
  const [deleteError, setDeleteError] = useState('')
  const [taskError, setTaskError] = useState('')
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  if (isLoading) return <Shell><div className="page-wrap"><PageSkeleton variant="detail" label="Cargando proyecto..." /></div></Shell>
  if (error || !project) return <Shell><div className="content-state page-state error-state"><p>El proyecto no existe o no tenés acceso.</p><Link className="button" to="/projects">Volver a proyectos</Link></div></Shell>
  const done = project.tasks.filter(task => task.status === 'done').length
  const total = project.tasks.length
  const progress = total ? Math.round(done / total * 100) : 0
  const status = projectStatus[project.status]
  const sortedTasks = [...project.tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar “${project.name}”? También se eliminarán sus tareas.`)) return
    setDeleteError('')
    try {
      await deleteProject.mutateAsync(project.id)
      showToast('Proyecto eliminado correctamente.')
      navigate('/projects', { replace: true })
    } catch {
      setDeleteError('No pudimos eliminar el proyecto. Intentá nuevamente.')
    }
  }
  const openTaskForm = (task?: Task) => { setEditingTask(task); setTaskFormOpen(true); setTaskError('') }
  const closeTaskForm = () => { setTaskFormOpen(false); setEditingTask(undefined) }
  const handleTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    setTaskError('')
    try { await updateTaskStatus.mutateAsync({ id: task.id, status: nextStatus }); showToast('Estado de la tarea actualizado.') }
    catch { setTaskError('No pudimos cambiar el estado de la tarea.') }
  }
  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`¿Eliminar la tarea “${task.title}”?`)) return
    setTaskError('')
    try { await deleteTask.mutateAsync(task.id); showToast('Tarea eliminada correctamente.') }
    catch { setTaskError('No pudimos eliminar la tarea.') }
  }
  return <Shell><div className="page-wrap">
    <Link className="back" to="/projects">← Volver a proyectos</Link>
    {deleteError && <div className="form-message error" role="alert">{deleteError}</div>}
    {taskError && <div className="form-message error" role="alert">{taskError}</div>}
    <div className="project-title"><div><div className="title-row"><span className={`project-symbol ${status.tone}`}><Code2 /></span><div><span className={`badge ${status.tone}`}><i />{status.label}</span><h1 data-no-translate>{project.name}</h1></div></div><p data-no-translate={project.description ? true : undefined}>{project.description || 'Sin descripción todavía.'}</p></div><div className="project-actions">{project.live_url && <a className="button" href={project.live_url} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Ver sitio</a>}{project.repository_url && <a className="button" href={project.repository_url} target="_blank" rel="noreferrer"><Github size={18} /> Repositorio</a>}<Link className="button" to={`/projects/${project.id}/edit`}><Pencil size={17} /> Editar</Link><button className="button danger" onClick={handleDelete} disabled={deleteProject.isPending}><Trash2 size={17} /> {deleteProject.isPending ? 'Eliminando...' : 'Eliminar'}</button></div></div>
    <ProjectRevivalMemory project={project} />
    <ProjectSharePanel project={project} />
    <div className="project-layout"><section>
      <div className="panel"><div className="panel-head"><div><h2>Tareas</h2><p>El próximo paso siempre visible.</p></div><div className="project-task-header-actions">{total > 0 && <Link className="button small" to={`/tasks?project=${project.id}`}><ListTodo size={16} /> Ver todas</Link>}<button className="button small primary" onClick={() => openTaskForm()}><Plus size={16} /> Nueva tarea</button></div></div>
        <div className="task-list">{sortedTasks.length ? sortedTasks.map(task => <div className="task" key={task.id}><button aria-label={task.status === 'done' ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`} onClick={() => handleTaskStatus(task, task.status === 'done' ? 'todo' : 'done')} className={task.status === 'done' ? 'task-check checked' : 'task-check'}>{task.status === 'done' && '✓'}</button><div className="task-content"><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><span data-no-translate={task.description ? true : undefined}>{task.description || (task.status === 'done' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente')}</span>{task.due_date && <small><CalendarDays size={12} /> {new Intl.DateTimeFormat(locale).format(new Date(`${task.due_date}T12:00:00`))}</small>}</div><select className={`task-status status-${task.status}`} value={task.status} onChange={event => handleTaskStatus(task, event.target.value as TaskStatus)} aria-label={`Estado de ${task.title}`}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span><div className="task-actions"><button className="icon-button" aria-label={`Editar ${task.title}`} onClick={() => openTaskForm(task)}><Pencil /></button><button className="icon-button danger-icon" aria-label={`Eliminar ${task.title}`} onClick={() => handleDeleteTask(task)}><Trash2 /></button></div></div>) : <div className="empty-tasks"><ListTodo /><p>Todavía no hay tareas en este proyecto.</p><button className="button small" onClick={() => openTaskForm()}><Plus size={16} /> Crear primera tarea</button></div>}</div>
      </div>
      <FocusHistoryPanel projectId={project.id} />
      <ProjectIntelligencePanel project={project} />
    </section><aside className="details">
      <div className="panel"><h3>Progreso</h3><div className="big-progress"><strong>{progress}%</strong><span>completado</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><p>{done} de {total} tareas completadas</p></div>
      <div className="panel"><h3>Tecnologías</h3><div className="tech-list large">{project.technologies.length ? project.technologies.map(item => <span data-no-translate key={item}>{item}</span>) : <p>Stack por definir.</p>}</div></div>
    </aside></div>
    {taskFormOpen && <TaskForm projectId={project.id} task={editingTask} onClose={closeTaskForm} />}
  </div></Shell>
}

function ProjectEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useProject(mode === 'edit' ? projectId : undefined)
  if (mode === 'edit' && isLoading) return <Shell><div className="form-page"><PageSkeleton variant="detail" label="Cargando proyecto..." /></div></Shell>
  if (mode === 'edit' && (error || !project)) return <Shell><div className="content-state page-state error-state"><p>No pudimos encontrar el proyecto.</p><Link className="button" to="/projects">Volver</Link></div></Shell>
  return <Shell><div className="form-page"><Link className="back" to={project ? `/projects/${project.id}` : '/projects'}>← Cancelar y volver</Link><div className="form-heading"><span className="stat-icon blue"><Sparkles /></span><div><h1>{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h1><p>{project ? 'Actualizá la información principal.' : 'Dale un hogar a tu próxima gran idea.'}</p></div></div><ProjectForm project={project} /></div></Shell>
}

function MyTasksPage() {
  const { preferences } = usePreferences()
  const { showToast } = useToast()
  const locale = preferences.language === 'en' ? 'en-US' : 'es-AR'
  const [searchParams] = useSearchParams()
  const { data: tasks = [], isLoading, error } = useMyTasks()
  const updateTaskStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState(() => searchParams.get('project') ?? 'all')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(preferences.defaultTaskView)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)
  const [editingTask, setEditingTask] = useState<TaskOverview | undefined>()
  const [taskError, setTaskError] = useState('')
  useEffect(() => setProjectFilter(searchParams.get('project') ?? 'all'), [searchParams])
  const projectOptions = [...new Map(tasks.map(task => [task.project_id, task.project_name])).entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
  const projectTasks = projectFilter === 'all' ? tasks : tasks.filter(task => task.project_id === projectFilter)
  const visibleTasks = projectTasks.filter(task => {
    const matchesSearch = `${task.title} ${task.project_name}`.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus = viewMode === 'kanban' || statusFilter === 'all' || task.status === statusFilter
    return matchesSearch && matchesStatus && (priorityFilter === 'all' || task.priority === priorityFilter)
  })
  const groupedTasks = projectOptions
    .map(project => ({ ...project, tasks: visibleTasks.filter(task => task.project_id === project.id) }))
    .filter(project => project.tasks.length > 0)

  const changeStatus = async (task: TaskOverview, status: TaskStatus) => {
    setTaskError('')
    try { await updateTaskStatus.mutateAsync({ id: task.id, status }); showToast('Estado de la tarea actualizado.') }
    catch { setTaskError('No pudimos cambiar el estado de la tarea.') }
  }
  const removeTask = async (task: TaskOverview) => {
    if (!window.confirm(`¿Eliminar la tarea “${task.title}”?`)) return
    setTaskError('')
    try { await deleteTask.mutateAsync(task.id); showToast('Tarea eliminada correctamente.') }
    catch { setTaskError('No pudimos eliminar la tarea.') }
  }
  const dropTask = async (status: TaskStatus) => {
    const task = tasks.find(item => item.id === draggingTaskId)
    setDraggingTaskId(null); setDropTarget(null)
    if (!task || task.status === status) return
    await changeStatus(task, status)
  }

  return <Shell><div className="tasks-page"><header className="tasks-heading"><div><p className="eyebrow">TU TRABAJO</p><h1>Mis tareas</h1><p>Todo lo pendiente, sin importar en qué proyecto esté.</p></div><div className="tasks-header-actions"><div className="view-toggle" aria-label="Cambiar vista"><button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Vista lista"><Rows3 size={17} /> Lista</button><button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')} title="Vista Kanban"><Columns3 size={17} /> Kanban</button></div><Link className="button primary" to="/projects"><FolderKanban size={17} /> Ver proyectos</Link></div></header>
    <section className="stats task-stats"><article><span className="stat-icon blue"><ListTodo /></span><div><strong>{projectTasks.filter(task => task.status === 'todo').length}</strong><p>Pendientes</p></div></article><article><span className="stat-icon green"><Rocket /></span><div><strong>{projectTasks.filter(task => task.status === 'in_progress').length}</strong><p>En progreso</p></div></article><article><span className="stat-icon violet"><CheckCircle2 /></span><div><strong>{projectTasks.filter(task => task.status === 'done').length}</strong><p>Completadas</p></div></article></section>
    <section className={`task-filters ${viewMode === 'kanban' ? 'kanban-filters' : ''}`}><label className="search"><Search size={17} /><input aria-label="Buscar tareas" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar tarea..." /></label><select aria-label="Filtrar por proyecto" value={projectFilter} onChange={event => setProjectFilter(event.target.value)}><option value="all">Todos los proyectos</option>{projectOptions.map(project => <option value={project.id} key={project.id}>{project.name}</option>)}</select>{viewMode === 'list' && <select aria-label="Filtrar por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos los estados</option><option value="todo">Pendientes</option><option value="in_progress">En progreso</option><option value="done">Completadas</option></select>}<select aria-label="Filtrar por prioridad" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value as typeof priorityFilter)}><option value="all">Todas las prioridades</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></section>
    {taskError && <div className="form-message error" role="alert">{taskError}</div>}{isLoading && <PageSkeleton variant="list" label="Cargando tareas..." />}{error && <div className="content-state error-state"><p>No pudimos cargar tus tareas.</p></div>}
    {!isLoading && !error && viewMode === 'list' && <section className="all-tasks-panel">{groupedTasks.length ? groupedTasks.map(project => <section className="project-task-group" key={project.id}><header className="project-task-heading"><div><span><FolderKanban size={17} /></span><div><h2 data-no-translate>{project.name}</h2><p>{project.tasks.length} {project.tasks.length === 1 ? 'tarea' : 'tareas'}</p></div></div><Link to={`/projects/${project.id}`}>Ver proyecto <ArrowRight size={14} /></Link></header>{project.tasks.map(task => <article className="global-task" key={task.id}><button className={task.status === 'done' ? 'task-check checked' : 'task-check'} onClick={() => changeStatus(task, task.status === 'done' ? 'todo' : 'done')} aria-label={task.status === 'done' ? `Reabrir ${task.title}` : `Completar ${task.title}`}>{task.status === 'done' && '✓'}</button><div className="global-task-main"><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><div>{task.due_date && <span className={new Date(`${task.due_date}T23:59:59`) < new Date() && task.status !== 'done' ? 'overdue' : ''}><CalendarDays size={12} /> {new Intl.DateTimeFormat(locale).format(new Date(`${task.due_date}T12:00:00`))}</span>}</div></div><select className={`task-status status-${task.status}`} value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span><div className="task-actions"><button className="icon-button" onClick={() => setEditingTask(task)} aria-label={`Editar ${task.title}`}><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeTask(task)} aria-label={`Eliminar ${task.title}`}><Trash2 /></button></div></article>)}</section>) : <div className="empty-tasks"><ListTodo /><p>No hay tareas que coincidan con los filtros.</p>{tasks.length === 0 && <Link className="button small" to="/projects">Crear una desde un proyecto</Link>}</div>}</section>}
    {!isLoading && !error && viewMode === 'kanban' && <section className="kanban-board">{taskColumns.map(column => { const columnTasks = visibleTasks.filter(task => task.status === column.status); return <div className={`kanban-column ${dropTarget === column.status ? 'drop-target' : ''}`} key={column.status} onDragOver={event => { event.preventDefault(); setDropTarget(column.status) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null) }} onDrop={event => { event.preventDefault(); dropTask(column.status) }}><header><div><i className={`column-dot ${column.status}`} /><h2>{column.label}</h2></div><span>{columnTasks.length}</span></header><div className="kanban-stack">{columnTasks.map(task => <article className={`kanban-card ${draggingTaskId === task.id ? 'dragging' : ''}`} draggable onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; setDraggingTaskId(task.id) }} onDragEnd={() => { setDraggingTaskId(null); setDropTarget(null) }} key={task.id}><div className="kanban-card-top"><GripVertical size={16} /><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span></div><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><Link data-no-translate className="kanban-project" to={`/projects/${task.project_id}`}><FolderKanban size={12} />{task.project_name}</Link>{task.due_date && <span className={`kanban-date ${new Date(`${task.due_date}T23:59:59`) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}><CalendarDays size={12} /> {new Intl.DateTimeFormat(locale).format(new Date(`${task.due_date}T12:00:00`))}</span>}<div className="kanban-card-footer"><select value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)} aria-label={`Mover ${task.title}`}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><div className="task-actions"><button className="icon-button" onClick={() => setEditingTask(task)} aria-label={`Editar ${task.title}`}><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeTask(task)} aria-label={`Eliminar ${task.title}`}><Trash2 /></button></div></div></article>)}{columnTasks.length === 0 && <div className="kanban-empty">Soltá una tarea acá</div>}</div></div>})}</section>}
    {editingTask && <TaskForm projectId={editingTask.project_id} task={editingTask} onClose={() => setEditingTask(undefined)} />}
  </div></Shell>
}

function ThemePreview({ mode }: { mode: 'light' | 'dark' | 'system' }) {
  return <span className={`theme-preview ${mode}-preview`} aria-hidden="true"><i className="preview-sidebar" /><span className="preview-content"><i className="preview-heading" /><i className="preview-card" /><i className="preview-card" /></span><i className="preview-action" /></span>
}

function SettingsPage() {
  const { user, updateEmail, updatePassword, signOut, signOutAll } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, preference, setTheme } = useTheme()
  const { preferences, updatePreference } = usePreferences()
  const { showToast } = useToast()
  const [username, setUsername] = useState(user?.user_metadata.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState((location.state as { passwordUpdated?: boolean } | null)?.passwordUpdated ? 'Tu contraseña se actualizó correctamente.' : '')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [closingSessions, setClosingSessions] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.rpc('api_get_my_profile').then(({ data }) => {
      if (data?.username) setUsername(data.username)
      if (data?.email) setEmail(data.email)
    })
  }, [user])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setProfileMessage(''); setSavingProfile(true)
    try {
      if (!user || username.trim().length < 2) throw new Error('El nombre debe tener al menos 2 caracteres.')
      const { error: profileError } = await supabase.rpc('api_update_my_profile', { p_username: username.trim() })
      if (profileError) throw profileError
      const { error: metadataError } = await supabase.auth.updateUser({ data: { username: username.trim() } })
      if (metadataError) throw metadataError
      if (email.trim().toLowerCase() !== user.email?.toLowerCase()) {
        await updateEmail(email)
        setProfileMessage('Datos guardados. Confirmá el nuevo email desde el mensaje que te enviamos.')
      } else setProfileMessage('Tus datos se guardaron correctamente.')
      showToast('Preferencias guardadas correctamente.')
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos guardar los cambios.') }
    finally { setSavingProfile(false) }
  }

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setPasswordMessage('')
    if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (newPassword !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setSavingPassword(true)
    try { await updatePassword(newPassword); setNewPassword(''); setConfirmation(''); setPasswordMessage('Tu contraseña se actualizó correctamente.'); showToast('Contraseña actualizada correctamente.') }
    catch { setError('No pudimos actualizar la contraseña. Volvé a iniciar sesión o usá la recuperación por email.') }
    finally { setSavingPassword(false) }
  }

  const exportData = async () => {
    setError(''); setExporting(true)
    try {
      const { data, error: exportError } = await supabase.rpc('api_export_my_data')
      if (exportError) throw exportError
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `devhub-export-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      showToast('Exportación preparada correctamente.')
    } catch { setError('No pudimos exportar tus datos.') }
    finally { setExporting(false) }
  }

  const closeAllSessions = async () => {
    if (!window.confirm('¿Cerrar tu sesión en todos los dispositivos?')) return
    setError(''); setClosingSessions(true)
    try { await signOutAll(); navigate('/login', { replace: true }) }
    catch { setError('No pudimos cerrar todas las sesiones.'); setClosingSessions(false) }
  }

  const closeCurrentSession = async () => {
    if (!window.confirm('¿Seguro que querés cerrar esta sesión?')) return
    setError('')
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch { setError('No pudimos cerrar la sesión. Intentá nuevamente.') }
  }

  const deleteAccount = async () => {
    if (!window.confirm('¿Querés eliminar tu cuenta? Se borrarán todos tus proyectos, tareas, ideas y sesiones Focus.')) return
    if (!window.confirm('Esta acción es permanente y no se puede deshacer. ¿Confirmás que querés eliminar todo?')) return
    setError(''); setDeletingAccount(true)
    try {
      const { error: deleteError } = await supabase.rpc('api_delete_my_account')
      if (deleteError) throw deleteError
      if (user) localStorage.removeItem(onboardingStorageKey(user.id))
      await signOut().catch(() => undefined)
      navigate('/login', { replace: true, state: { accountDeleted: true } })
    } catch { setError('No pudimos eliminar la cuenta. Volvé a iniciar sesión e intentá nuevamente.'); setDeletingAccount(false) }
  }

  const restartOnboarding = () => {
    if (user) localStorage.removeItem(onboardingStorageKey(user.id))
    navigate('/dashboard')
  }

  return <Shell><div className="settings-page"><div className="settings-heading"><p className="eyebrow">TU ESPACIO</p><h1>Configuración</h1><p>Personalizá la experiencia, tu cuenta y la privacidad de tus datos.</p></div>
    {error && <div className="form-message error" role="alert">{error}</div>}
    <div className="settings-grid">
      <div className="settings-section-heading settings-wide"><span><SlidersHorizontal /></span><div><p className="eyebrow">EXPERIENCIA</p><h2>Cómo funciona tu espacio</h2><small>Apariencia, navegación, Focus y asistencia.</small></div></div>
      <section className="settings-card settings-wide language-settings-card"><div className="settings-card-title"><span><Languages /></span><div><h2>Idioma</h2><p>Elegí el idioma de toda la interfaz.</p></div></div><label>Idioma de la aplicación<select value={preferences.language} onChange={event => updatePreference('language', event.target.value as typeof preferences.language)}><option value="es">Español</option><option value="en">English</option></select></label></section>
      <section className="settings-card settings-wide focus-settings-card"><div className="settings-card-title"><span><Timer /></span><div><h2>Preferencias Focus</h2><p>Personalizá cómo empiezan, terminan y se muestran tus sesiones.</p></div></div><div className="focus-settings-selects"><label>Duración predeterminada<select value={preferences.focusDefaultMinutes} onChange={event => updatePreference('focusDefaultMinutes', Number(event.target.value))}><option value={25}>25 minutos</option><option value={30}>30 minutos</option><option value={45}>45 minutos</option><option value={60}>1 hora</option><option value={90}>1 hora 30</option><option value={120}>2 horas</option></select><small>Se seleccionará automáticamente al preparar un nuevo Focus.</small></label><label>Posición del temporizador<select value={preferences.focusTimerPosition} onChange={event => updatePreference('focusTimerPosition', event.target.value as typeof preferences.focusTimerPosition)}><option value="top-right">Arriba a la derecha</option><option value="top-left">Arriba a la izquierda</option><option value="bottom-left">Abajo a la izquierda</option></select><small>Podés elegir el lugar que menos interfiera con tu trabajo.</small></label><label>Objetivo diario<select value={preferences.focusDailyGoalMinutes} onChange={event => updatePreference('focusDailyGoalMinutes', Number(event.target.value))}><option value={30}>30 minutos</option><option value={60}>1 hora</option><option value={90}>1 hora 30</option><option value={120}>2 horas</option><option value={180}>3 horas</option><option value={240}>4 horas</option></select><small>El asistente usará esta meta para interpretar tu ritmo diario.</small></label></div><div className="settings-switches focus-settings-switches"><label className="setting-switch-row"><div><strong>Iniciar minimizado</strong><small>Las nuevas sesiones mostrarán únicamente el tiempo restante.</small></div><input type="checkbox" checked={preferences.focusStartMinimized} onChange={event => updatePreference('focusStartMinimized', event.target.checked)} /><i /></label><label className="setting-switch-row"><div><strong>Sonido al finalizar</strong><small>Reproduce un aviso breve cuando el contador llega a cero.</small></div><input type="checkbox" checked={preferences.focusSoundEnabled} onChange={event => updatePreference('focusSoundEnabled', event.target.checked)} /><i /></label><label className="setting-switch-row"><div><strong>Confirmar antes de descartar</strong><small>Evita perder accidentalmente una sesión que todavía no guardaste.</small></div><input type="checkbox" checked={preferences.focusConfirmDiscard} onChange={event => updatePreference('focusConfirmDiscard', event.target.checked)} /><i /></label><label className="setting-switch-row"><div><strong>Usar historial en el asistente</strong><small>Permite recomendaciones basadas en tiempos, resultados y próximos pasos.</small></div><input type="checkbox" checked={preferences.assistantUseFocusHistory} disabled={!preferences.assistantEnabled} onChange={event => updatePreference('assistantUseFocusHistory', event.target.checked)} /><i /></label></div></section>
      <section className="settings-card settings-wide"><div className="settings-card-title"><span>{preference === 'system' ? <Laptop /> : theme === 'dark' ? <Moon /> : <Sun />}</span><div><h2>Apariencia</h2><p>Elegí el tema o seguí automáticamente la configuración del dispositivo.</p></div></div><div className="theme-options"><button className={preference === 'light' ? 'active' : ''} type="button" onClick={() => setTheme('light')} aria-pressed={preference === 'light'}><ThemePreview mode="light" /><strong><Sun size={16} /> Claro</strong></button><button className={preference === 'dark' ? 'active' : ''} type="button" onClick={() => setTheme('dark')} aria-pressed={preference === 'dark'}><ThemePreview mode="dark" /><strong><Moon size={16} /> Oscuro</strong></button><button className={preference === 'system' ? 'active' : ''} type="button" onClick={() => setTheme('system')} aria-pressed={preference === 'system'}><ThemePreview mode="system" /><strong><Laptop size={16} /> Sistema</strong></button></div></section>
      <section className="settings-card settings-wide"><div className="settings-card-title"><span><SlidersHorizontal /></span><div><h2>Preferencias del espacio</h2><p>Definí dónde empezar y cómo organizar tu trabajo.</p></div></div><div className="settings-preference-grid"><label>Página de inicio<select value={preferences.defaultPage} onChange={event => updatePreference('defaultPage', event.target.value as typeof preferences.defaultPage)}><option value="/dashboard">Inicio y resumen</option><option value="/projects">Proyectos</option><option value="/tasks">Mis tareas</option><option value="/ideas">Ideas</option></select><small>Se abrirá después de iniciar sesión y al tocar el logo.</small></label><label>Vista predeterminada de tareas<select value={preferences.defaultTaskView} onChange={event => updatePreference('defaultTaskView', event.target.value as typeof preferences.defaultTaskView)}><option value="list">Lista</option><option value="kanban">Kanban</option></select><small>Se aplicará al volver a entrar en Mis tareas.</small></label></div></section>
      <section className="settings-card settings-wide"><div className="settings-card-title"><span><Bot /></span><div><h2>Asistente DevHub</h2><p>Controlá su presencia y el tipo de ayuda que querés recibir.</p></div></div><div className="settings-switches"><label className="setting-switch-row"><div><strong>Mostrar asistente</strong><small>Activa el botón flotante en toda la aplicación.</small></div><input type="checkbox" checked={preferences.assistantEnabled} onChange={event => updatePreference('assistantEnabled', event.target.checked)} /><i /></label><label className="setting-switch-row"><div><strong>Sugerencias rápidas</strong><small>Muestra preguntas relacionadas debajo de la conversación.</small></div><input type="checkbox" checked={preferences.assistantSuggestions} disabled={!preferences.assistantEnabled} onChange={event => updatePreference('assistantSuggestions', event.target.checked)} /><i /></label><label className="setting-switch-row"><div><strong>Recomendación al abrir</strong><small>Analiza tu trabajo y propone automáticamente un proyecto.</small></div><input type="checkbox" checked={preferences.proactiveRecommendations} disabled={!preferences.assistantEnabled} onChange={event => updatePreference('proactiveRecommendations', event.target.checked)} /><i /></label></div></section>
      <section className="settings-card"><div className="settings-card-title"><span><Sparkles /></span><div><h2>Ayuda y recorrido</h2><p>Repasá las funciones principales de DevHub.</p></div></div><p className="settings-card-copy">Volvé a ver el tutorial inicial para recordar dónde está cada herramienta.</p><button className="button" type="button" onClick={restartOnboarding}><Sparkles size={17} /> Repetir tutorial</button></section>
      <div className="settings-section-heading settings-wide"><span><ShieldCheck /></span><div><p className="eyebrow">CUENTA Y SEGURIDAD</p><h2>Tu identidad y acceso</h2><small>Datos personales, contraseña y sesiones abiertas.</small></div></div>
      <form className="settings-card" onSubmit={saveProfile}><div className="settings-card-title"><span><UserRound /></span><div><h2>Perfil</h2><p>La información que identifica tu cuenta.</p></div></div><label>Nombre<input value={username} onChange={event => setUsername(event.target.value)} /></label><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>{profileMessage && <div className="form-message success">{profileMessage}</div>}<button className="button primary" disabled={savingProfile}><Save size={17} /> {savingProfile ? 'Guardando...' : 'Guardar cambios'}</button></form>
      <form className="settings-card" onSubmit={savePassword}><div className="settings-card-title"><span><KeyRound /></span><div><h2>Contraseña</h2><p>Usá una contraseña única de al menos 8 caracteres.</p></div></div><label>Nueva contraseña<input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>{passwordMessage && <div className="form-message success">{passwordMessage}</div>}<button className="button primary" disabled={savingPassword}><KeyRound size={17} /> {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}</button></form>
      <section className="settings-card"><div className="settings-card-title"><span><ShieldCheck /></span><div><h2>Sesiones</h2><p>Protegé la cuenta y controlá dónde está abierta.</p></div></div><p className="settings-card-copy">Podés cerrar solamente este dispositivo o revocar todas las sesiones activas.</p><div className="settings-session-actions"><button className="button" type="button" onClick={closeCurrentSession}><LogOut size={17} /> Cerrar esta sesión</button><button className="button" type="button" onClick={closeAllSessions} disabled={closingSessions}><ShieldCheck size={17} /> {closingSessions ? 'Cerrando sesiones...' : 'Cerrar todas'}</button></div></section>
      <div className="settings-section-heading settings-wide"><span><Database /></span><div><p className="eyebrow">DATOS Y PRIVACIDAD</p><h2>Control de tu información</h2><small>Descargá una copia o eliminá permanentemente la cuenta.</small></div></div>
      <section className="settings-card"><div className="settings-card-title"><span><Database /></span><div><h2>Datos y privacidad</h2><p>Descargá una copia de toda tu información.</p></div></div><p className="settings-card-copy">Incluye tu perfil, proyectos, tareas e ideas en un archivo JSON.</p><button className="button" type="button" onClick={exportData} disabled={exporting}><Download size={17} /> {exporting ? 'Preparando archivo...' : 'Exportar mis datos'}</button></section>
      <section className="settings-card danger-zone"><div className="settings-card-title"><span><Trash2 /></span><div><h2>Eliminar cuenta</h2><p>Borrá permanentemente tu cuenta y todos sus datos.</p></div></div><p className="settings-card-copy">No vas a poder recuperar proyectos, tareas, ideas, recursos ni sesiones Focus después de eliminarla.</p><button className="button danger" type="button" onClick={deleteAccount} disabled={deletingAccount}><Trash2 size={17} /> {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}</button></section>
    </div></div></Shell>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="route-loader"><span /><p>Preparando tu espacio...</p></div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export function App() {
  return <Suspense fallback={<div className="route-loader"><span /><p>Cargando pantalla...</p></div>}><Routes><Route path="/demo" element={<DemoPage />} /><Route path="/showcase/:slug" element={<PublicProjectPage />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} /><Route path="/tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} /><Route path="/ideas" element={<ProtectedRoute><Shell><IdeasPage /></Shell></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /><Route path="/projects/new" element={<ProtectedRoute><ProjectEditorPage mode="create" /></ProtectedRoute>} /><Route path="/projects/:projectId/edit" element={<ProtectedRoute><ProjectEditorPage mode="edit" /></ProtectedRoute>} /><Route path="/projects/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes></Suspense>
}
