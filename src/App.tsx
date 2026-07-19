import { ArrowRight, CalendarDays, CheckCircle2, Code2, Columns3, ExternalLink, FolderKanban, Github, GripVertical, KeyRound, LayoutDashboard, Lightbulb, ListTodo, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Rocket, Rows3, Save, Search, Settings as SettingsIcon, Sparkles, Sun, Trash2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/AuthProvider'
import { ForgotPasswordPage, ResetPasswordPage } from './features/auth/PasswordPages'
import { ProjectForm } from './features/projects/ProjectForm'
import { IdeasPage } from './features/ideas/IdeasPage'
import { useDeleteProject, useProject, useProjects } from './features/projects/projectApi'
import { TaskForm } from './features/tasks/TaskForm'
import { useDeleteTask, useMyTasks, useUpdateTaskStatus } from './features/tasks/taskApi'
import type { TaskOverview } from './features/tasks/taskApi'
import { supabase } from './lib/supabase'
import { useTheme } from './features/theme/themeContext'
import type { ProjectStatus, Task, TaskStatus } from './types/database'

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
  return <Link className="brand" to="/dashboard"><span className="brand-mark"><Code2 size={19} /></span><span className="brand-name">Dev<span>Hub</span></span></Link>
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const projectsActive = location.pathname === '/dashboard' || location.pathname.startsWith('/projects')
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const initials = username.slice(0, 2).toUpperCase()
  const { theme, toggleTheme } = useTheme()
  const handleSignOut = async () => { await signOut(); navigate('/login', { replace: true }) }

  return <aside className="sidebar">
    <div className="sidebar-header"><Brand /><button className="sidebar-toggle" type="button" onClick={onToggle} aria-label={collapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'} title={collapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
    <nav>
      <Link className={`nav-link ${projectsActive ? 'active' : ''}`} to="/dashboard" title="Proyectos"><LayoutDashboard size={18} /><span className="nav-label">Proyectos</span></Link>
      <Link className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`} to="/tasks" title="Mis tareas"><ListTodo size={18} /><span className="nav-label">Mis tareas</span></Link>
      <Link className={`nav-link ${location.pathname === '/ideas' ? 'active' : ''}`} to="/ideas" title="Ideas"><Lightbulb size={18} /><span className="nav-label">Ideas</span></Link>
      <Link className={`nav-link mobile-settings-link ${location.pathname === '/settings' ? 'active' : ''}`} to="/settings" aria-label="Configuración"><SettingsIcon size={18} /><span className="nav-label">Configuración</span></Link>
      <button className="nav-link mobile-theme-toggle" type="button" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}<span className="nav-label">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span></button>
    </nav>
    <div className="sidebar-bottom">
      <div className="account-row"><div className="user"><div className="avatar">{initials}</div><div><strong>{username}</strong></div></div><button className="account-settings quick-theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'} title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button><Link className={`account-settings ${location.pathname === '/settings' ? 'active' : ''}`} to="/settings" aria-label="Configuración" title="Configuración"><SettingsIcon size={18} /></Link></div>
      <button className="logout" type="button" onClick={handleSignOut}><LogOut size={17} /><span className="logout-label">Cerrar sesión</span></button>
    </div>
  </aside>
}

function Shell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('devhub-sidebar-collapsed') === 'true')
  const toggleSidebar = () => setSidebarCollapsed(current => {
    const next = !current
    localStorage.setItem('devhub-sidebar-collapsed', String(next))
    return next
  })
  return <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}><Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} /><main className="main">{children}</main></div>
}

function Dashboard() {
  const { user } = useAuth()
  const { data: projects = [], isLoading, error } = useProjects()
  const [search, setSearch] = useState('')
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const today = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()
  const visibleProjects = projects.filter(project => project.name.toLowerCase().includes(search.trim().toLowerCase()))
  const completedTasks = projects.reduce((total, project) => total + project.tasks.filter(task => task.status === 'done').length, 0)
  return <Shell>
    <header className="topbar"><div><p className="eyebrow">{today}</p><h1>Buenos días, {username} <span>👋</span></h1><p>Todo lo que estás construyendo, en un solo lugar.</p></div><Link className="button primary" to="/projects/new"><Plus size={18} /> Nuevo proyecto</Link></header>
    <section className="stats">
      <article><span className="stat-icon blue"><FolderKanban /></span><div><strong>{projects.length}</strong><p>Proyectos totales</p></div></article>
      <article><span className="stat-icon green"><Rocket /></span><div><strong>{projects.filter(project => project.status === 'in_progress').length}</strong><p>En progreso</p></div></article>
      <article><span className="stat-icon violet"><CheckCircle2 /></span><div><strong>{completedTasks}</strong><p>Tareas completadas</p></div></article>
    </section>
    <section className="section-head"><div><h2>Tus proyectos</h2><p>Continúa donde lo dejaste.</p></div><label className="search"><Search size={17} /><input aria-label="Buscar proyectos" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar proyecto..." /></label></section>
    {isLoading && <div className="content-state"><span className="mini-loader" /><p>Cargando proyectos...</p></div>}
    {error && <div className="content-state error-state"><p>No pudimos cargar tus proyectos.</p></div>}
    <section className="project-grid">
      {visibleProjects.map(project => {
        const done = project.tasks.filter(task => task.status === 'done').length
        const total = project.tasks.length
        const status = projectStatus[project.status]
        return <Link to={`/projects/${project.id}`} className="project-card" key={project.id}>
        <div className="card-top"><span className={`project-symbol ${status.tone}`}><Code2 /></span><span className={`badge ${status.tone}`}><i />{status.label}</span></div>
        <h3>{project.name}</h3><p>{project.description || 'Sin descripción todavía.'}</p>
        <div className="tech-list">{project.technologies.length ? project.technologies.map(item => <span key={item}>{item}</span>) : <span>Stack por definir</span>}</div>
        <div className="progress-label"><span>Progreso</span><strong>{done}/{total} tareas</strong></div>
        <div className="progress"><i style={{ width: `${total ? done / total * 100 : 0}%` }} /></div>
        <div className="card-footer"><span>Actualizado {relativeDate(project.updated_at)}</span><ArrowRight size={18} /></div>
      </Link>})}
      {!isLoading && !error && search && visibleProjects.length === 0 && <div className="empty-search"><p>No encontramos proyectos con “{search}”.</p></div>}
      <Link to="/projects/new" className="new-card"><span><Plus /></span><strong>Crear nuevo proyecto</strong><p>Convierte esa idea en algo real.</p></Link>
    </section>
  </Shell>
}

function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(projectId)
  const deleteProject = useDeleteProject()
  const deleteTask = useDeleteTask()
  const updateTaskStatus = useUpdateTaskStatus()
  const [deleteError, setDeleteError] = useState('')
  const [taskError, setTaskError] = useState('')
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>()
  if (isLoading) return <Shell><div className="content-state page-state"><span className="mini-loader" /><p>Cargando proyecto...</p></div></Shell>
  if (error || !project) return <Shell><div className="content-state page-state error-state"><p>El proyecto no existe o no tenés acceso.</p><Link className="button" to="/dashboard">Volver al dashboard</Link></div></Shell>
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
      navigate('/dashboard', { replace: true })
    } catch {
      setDeleteError('No pudimos eliminar el proyecto. Intentá nuevamente.')
    }
  }
  const openTaskForm = (task?: Task) => { setEditingTask(task); setTaskFormOpen(true); setTaskError('') }
  const closeTaskForm = () => { setTaskFormOpen(false); setEditingTask(undefined) }
  const handleTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    setTaskError('')
    try { await updateTaskStatus.mutateAsync({ id: task.id, status: nextStatus }) }
    catch { setTaskError('No pudimos cambiar el estado de la tarea.') }
  }
  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`¿Eliminar la tarea “${task.title}”?`)) return
    setTaskError('')
    try { await deleteTask.mutateAsync(task.id) }
    catch { setTaskError('No pudimos eliminar la tarea.') }
  }
  return <Shell><div className="page-wrap">
    <Link className="back" to="/dashboard">← Volver a proyectos</Link>
    {deleteError && <div className="form-message error" role="alert">{deleteError}</div>}
    {taskError && <div className="form-message error" role="alert">{taskError}</div>}
    <div className="project-title"><div><div className="title-row"><span className={`project-symbol ${status.tone}`}><Code2 /></span><div><span className={`badge ${status.tone}`}><i />{status.label}</span><h1>{project.name}</h1></div></div><p>{project.description || 'Sin descripción todavía.'}</p></div><div className="project-actions">{project.live_url && <a className="button" href={project.live_url} target="_blank" rel="noreferrer"><ExternalLink size={18} /> Ver sitio</a>}{project.repository_url && <a className="button" href={project.repository_url} target="_blank" rel="noreferrer"><Github size={18} /> Repositorio</a>}<Link className="button" to={`/projects/${project.id}/edit`}><Pencil size={17} /> Editar</Link><button className="button danger" onClick={handleDelete} disabled={deleteProject.isPending}><Trash2 size={17} /> {deleteProject.isPending ? 'Eliminando...' : 'Eliminar'}</button></div></div>
    <div className="project-layout"><section>
      <div className="panel"><div className="panel-head"><div><h2>Tareas</h2><p>El próximo paso siempre visible.</p></div><button className="button small" onClick={() => openTaskForm()}><Plus size={16} /> Nueva tarea</button></div>
        <div className="task-list">{sortedTasks.length ? sortedTasks.map(task => <div className="task" key={task.id}><button aria-label={task.status === 'done' ? `Marcar ${task.title} como pendiente` : `Completar ${task.title}`} onClick={() => handleTaskStatus(task, task.status === 'done' ? 'todo' : 'done')} className={task.status === 'done' ? 'task-check checked' : 'task-check'}>{task.status === 'done' && '✓'}</button><div className="task-content"><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><span>{task.description || (task.status === 'done' ? 'Completada' : task.status === 'in_progress' ? 'En progreso' : 'Pendiente')}</span>{task.due_date && <small><CalendarDays size={12} /> {new Intl.DateTimeFormat('es-AR').format(new Date(`${task.due_date}T12:00:00`))}</small>}</div><select className={`task-status status-${task.status}`} value={task.status} onChange={event => handleTaskStatus(task, event.target.value as TaskStatus)} aria-label={`Estado de ${task.title}`}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span><div className="task-actions"><button className="icon-button" aria-label={`Editar ${task.title}`} onClick={() => openTaskForm(task)}><Pencil /></button><button className="icon-button danger-icon" aria-label={`Eliminar ${task.title}`} onClick={() => handleDeleteTask(task)}><Trash2 /></button></div></div>) : <div className="empty-tasks"><ListTodo /><p>Todavía no hay tareas en este proyecto.</p><button className="button small" onClick={() => openTaskForm()}><Plus size={16} /> Crear primera tarea</button></div>}</div>
      </div>
    </section><aside className="details">
      <div className="panel"><h3>Progreso</h3><div className="big-progress"><strong>{progress}%</strong><span>completado</span></div><div className="progress"><i style={{ width: `${progress}%` }} /></div><p>{done} de {total} tareas completadas</p></div>
      <div className="panel"><h3>Tecnologías</h3><div className="tech-list large">{project.technologies.length ? project.technologies.map(item => <span key={item}>{item}</span>) : <p>Stack por definir.</p>}</div></div>
    </aside></div>
    {taskFormOpen && <TaskForm projectId={project.id} task={editingTask} onClose={closeTaskForm} />}
  </div></Shell>
}

function ProjectEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const { projectId } = useParams()
  const { data: project, isLoading, error } = useProject(mode === 'edit' ? projectId : undefined)
  if (mode === 'edit' && isLoading) return <Shell><div className="content-state page-state"><span className="mini-loader" /><p>Cargando proyecto...</p></div></Shell>
  if (mode === 'edit' && (error || !project)) return <Shell><div className="content-state page-state error-state"><p>No pudimos encontrar el proyecto.</p><Link className="button" to="/dashboard">Volver</Link></div></Shell>
  return <Shell><div className="form-page"><Link className="back" to={project ? `/projects/${project.id}` : '/dashboard'}>← Cancelar y volver</Link><div className="form-heading"><span className="stat-icon blue"><Sparkles /></span><div><h1>{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h1><p>{project ? 'Actualizá la información principal.' : 'Dale un hogar a tu próxima gran idea.'}</p></div></div><ProjectForm project={project} /></div></Shell>
}

function MyTasksPage() {
  const { data: tasks = [], isLoading, error } = useMyTasks()
  const updateTaskStatus = useUpdateTaskStatus()
  const deleteTask = useDeleteTask()
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)
  const [editingTask, setEditingTask] = useState<TaskOverview | undefined>()
  const [taskError, setTaskError] = useState('')
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
    try { await updateTaskStatus.mutateAsync({ id: task.id, status }) }
    catch { setTaskError('No pudimos cambiar el estado de la tarea.') }
  }
  const removeTask = async (task: TaskOverview) => {
    if (!window.confirm(`¿Eliminar la tarea “${task.title}”?`)) return
    setTaskError('')
    try { await deleteTask.mutateAsync(task.id) }
    catch { setTaskError('No pudimos eliminar la tarea.') }
  }
  const dropTask = async (status: TaskStatus) => {
    const task = tasks.find(item => item.id === draggingTaskId)
    setDraggingTaskId(null); setDropTarget(null)
    if (!task || task.status === status) return
    await changeStatus(task, status)
  }

  return <Shell><div className="tasks-page"><header className="tasks-heading"><div><p className="eyebrow">TU TRABAJO</p><h1>Mis tareas</h1><p>Todo lo pendiente, sin importar en qué proyecto esté.</p></div><div className="tasks-header-actions"><div className="view-toggle" aria-label="Cambiar vista"><button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} title="Vista lista"><Rows3 size={17} /> Lista</button><button className={viewMode === 'kanban' ? 'active' : ''} onClick={() => setViewMode('kanban')} title="Vista Kanban"><Columns3 size={17} /> Kanban</button></div><Link className="button primary" to="/dashboard"><FolderKanban size={17} /> Ver proyectos</Link></div></header>
    <section className="stats task-stats"><article><span className="stat-icon blue"><ListTodo /></span><div><strong>{projectTasks.filter(task => task.status === 'todo').length}</strong><p>Pendientes</p></div></article><article><span className="stat-icon green"><Rocket /></span><div><strong>{projectTasks.filter(task => task.status === 'in_progress').length}</strong><p>En progreso</p></div></article><article><span className="stat-icon violet"><CheckCircle2 /></span><div><strong>{projectTasks.filter(task => task.status === 'done').length}</strong><p>Completadas</p></div></article></section>
    <section className={`task-filters ${viewMode === 'kanban' ? 'kanban-filters' : ''}`}><label className="search"><Search size={17} /><input aria-label="Buscar tareas" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar tarea..." /></label><select aria-label="Filtrar por proyecto" value={projectFilter} onChange={event => setProjectFilter(event.target.value)}><option value="all">Todos los proyectos</option>{projectOptions.map(project => <option value={project.id} key={project.id}>{project.name}</option>)}</select>{viewMode === 'list' && <select aria-label="Filtrar por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos los estados</option><option value="todo">Pendientes</option><option value="in_progress">En progreso</option><option value="done">Completadas</option></select>}<select aria-label="Filtrar por prioridad" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value as typeof priorityFilter)}><option value="all">Todas las prioridades</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></section>
    {taskError && <div className="form-message error" role="alert">{taskError}</div>}{isLoading && <div className="content-state"><span className="mini-loader" /><p>Cargando tareas...</p></div>}{error && <div className="content-state error-state"><p>No pudimos cargar tus tareas.</p></div>}
    {!isLoading && !error && viewMode === 'list' && <section className="all-tasks-panel">{groupedTasks.length ? groupedTasks.map(project => <section className="project-task-group" key={project.id}><header className="project-task-heading"><div><span><FolderKanban size={17} /></span><div><h2>{project.name}</h2><p>{project.tasks.length} {project.tasks.length === 1 ? 'tarea' : 'tareas'}</p></div></div><Link to={`/projects/${project.id}`}>Ver proyecto <ArrowRight size={14} /></Link></header>{project.tasks.map(task => <article className="global-task" key={task.id}><button className={task.status === 'done' ? 'task-check checked' : 'task-check'} onClick={() => changeStatus(task, task.status === 'done' ? 'todo' : 'done')} aria-label={task.status === 'done' ? `Reabrir ${task.title}` : `Completar ${task.title}`}>{task.status === 'done' && '✓'}</button><div className="global-task-main"><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><div>{task.due_date && <span className={new Date(`${task.due_date}T23:59:59`) < new Date() && task.status !== 'done' ? 'overdue' : ''}><CalendarDays size={12} /> {new Intl.DateTimeFormat('es-AR').format(new Date(`${task.due_date}T12:00:00`))}</span>}</div></div><select className={`task-status status-${task.status}`} value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span><div className="task-actions"><button className="icon-button" onClick={() => setEditingTask(task)} aria-label={`Editar ${task.title}`}><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeTask(task)} aria-label={`Eliminar ${task.title}`}><Trash2 /></button></div></article>)}</section>) : <div className="empty-tasks"><ListTodo /><p>No hay tareas que coincidan con los filtros.</p>{tasks.length === 0 && <Link className="button small" to="/dashboard">Crear una desde un proyecto</Link>}</div>}</section>}
    {!isLoading && !error && viewMode === 'kanban' && <section className="kanban-board">{taskColumns.map(column => { const columnTasks = visibleTasks.filter(task => task.status === column.status); return <div className={`kanban-column ${dropTarget === column.status ? 'drop-target' : ''}`} key={column.status} onDragOver={event => { event.preventDefault(); setDropTarget(column.status) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null) }} onDrop={event => { event.preventDefault(); dropTask(column.status) }}><header><div><i className={`column-dot ${column.status}`} /><h2>{column.label}</h2></div><span>{columnTasks.length}</span></header><div className="kanban-stack">{columnTasks.map(task => <article className={`kanban-card ${draggingTaskId === task.id ? 'dragging' : ''}`} draggable onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; setDraggingTaskId(task.id) }} onDragEnd={() => { setDraggingTaskId(null); setDropTarget(null) }} key={task.id}><div className="kanban-card-top"><GripVertical size={16} /><span className={`priority ${task.priority === 'high' ? 'alta' : task.priority === 'low' ? 'baja' : 'media'}`}>{task.priority === 'high' ? 'Alta' : task.priority === 'low' ? 'Baja' : 'Media'}</span></div><strong className={task.status === 'done' ? 'completed-title' : ''}>{task.title}</strong><Link className="kanban-project" to={`/projects/${task.project_id}`}><FolderKanban size={12} />{task.project_name}</Link>{task.due_date && <span className={`kanban-date ${new Date(`${task.due_date}T23:59:59`) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}><CalendarDays size={12} /> {new Intl.DateTimeFormat('es-AR').format(new Date(`${task.due_date}T12:00:00`))}</span>}<div className="kanban-card-footer"><select value={task.status} onChange={event => changeStatus(task, event.target.value as TaskStatus)} aria-label={`Mover ${task.title}`}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select><div className="task-actions"><button className="icon-button" onClick={() => setEditingTask(task)} aria-label={`Editar ${task.title}`}><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeTask(task)} aria-label={`Eliminar ${task.title}`}><Trash2 /></button></div></div></article>)}{columnTasks.length === 0 && <div className="kanban-empty">Soltá una tarea acá</div>}</div></div>})}</section>}
    {editingTask && <TaskForm projectId={editingTask.project_id} task={editingTask} onClose={() => setEditingTask(undefined)} />}
  </div></Shell>
}

function SettingsPage() {
  const { user, updateEmail, updatePassword } = useAuth()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [username, setUsername] = useState(user?.user_metadata.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState((location.state as { passwordUpdated?: boolean } | null)?.passwordUpdated ? 'Tu contraseña se actualizó correctamente.' : '')
  const [error, setError] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

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
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos guardar los cambios.') }
    finally { setSavingProfile(false) }
  }

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setPasswordMessage('')
    if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (newPassword !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setSavingPassword(true)
    try { await updatePassword(newPassword); setNewPassword(''); setConfirmation(''); setPasswordMessage('Tu contraseña se actualizó correctamente.') }
    catch { setError('No pudimos actualizar la contraseña. Volvé a iniciar sesión o usá la recuperación por email.') }
    finally { setSavingPassword(false) }
  }

  return <Shell><div className="settings-page"><div className="settings-heading"><p className="eyebrow">TU CUENTA</p><h1>Configuración</h1><p>Administrá tus datos y la seguridad de tu cuenta.</p></div>
    {error && <div className="form-message error" role="alert">{error}</div>}
    <div className="settings-grid"><section className="settings-card appearance-card"><div className="settings-card-title"><span>{theme === 'dark' ? <Moon /> : <Sun />}</span><div><h2>Apariencia</h2><p>Elegí cómo querés ver tu espacio de trabajo.</p></div></div><div className="theme-options"><button className={theme === 'light' ? 'active' : ''} type="button" onClick={() => setTheme('light')}><span className="theme-preview light-preview"><i /><i /><i /></span><strong><Sun size={16} /> Claro</strong></button><button className={theme === 'dark' ? 'active' : ''} type="button" onClick={() => setTheme('dark')}><span className="theme-preview dark-preview"><i /><i /><i /></span><strong><Moon size={16} /> Oscuro</strong></button></div></section><form className="settings-card" onSubmit={saveProfile}><div className="settings-card-title"><span><UserRound /></span><div><h2>Perfil</h2><p>La información que identifica tu cuenta.</p></div></div><label>Nombre<input value={username} onChange={event => setUsername(event.target.value)} /></label><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>{profileMessage && <div className="form-message success">{profileMessage}</div>}<button className="button primary" disabled={savingProfile}><Save size={17} /> {savingProfile ? 'Guardando...' : 'Guardar cambios'}</button></form>
      <form className="settings-card" onSubmit={savePassword}><div className="settings-card-title"><span><KeyRound /></span><div><h2>Contraseña</h2><p>Usá una contraseña única de al menos 8 caracteres.</p></div></div><label>Nueva contraseña<input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>{passwordMessage && <div className="form-message success">{passwordMessage}</div>}<button className="button primary" disabled={savingPassword}><KeyRound size={17} /> {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}</button></form>
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
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/tasks" element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} /><Route path="/ideas" element={<ProtectedRoute><Shell><IdeasPage /></Shell></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /><Route path="/projects/new" element={<ProtectedRoute><ProjectEditorPage mode="create" /></ProtectedRoute>} /><Route path="/projects/:projectId/edit" element={<ProtectedRoute><ProjectEditorPage mode="edit" /></ProtectedRoute>} /><Route path="/projects/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>
}
