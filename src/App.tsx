import { ArrowRight, CheckCircle2, Code2, FolderKanban, Github, KeyRound, LayoutDashboard, ListTodo, LogOut, Plus, Rocket, Save, Search, Settings as SettingsIcon, Sparkles, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/AuthProvider'
import { ForgotPasswordPage, ResetPasswordPage } from './features/auth/PasswordPages'
import { supabase } from './lib/supabase'

const projects = [
  { id: 'devtrack', name: 'DevTrack', description: 'El centro de control para todos mis proyectos.', status: 'En progreso', tone: 'green', tech: ['React', 'TypeScript', 'Supabase'], done: 8, total: 12, updated: 'Hoy' },
  { id: 'portfolio', name: 'Portfolio 2026', description: 'Portfolio personal y archivo de experimentos.', status: 'Pausado', tone: 'amber', tech: ['Astro', 'Tailwind'], done: 4, total: 10, updated: 'Hace 12 días' },
  { id: 'saas-idea', name: 'Micro SaaS', description: 'Validación de una herramienta para freelancers.', status: 'Idea', tone: 'violet', tech: ['Next.js', 'PostgreSQL'], done: 0, total: 6, updated: 'Hace 3 días' },
]

const tasks = [
  { title: 'Configurar autenticación', priority: 'Alta', status: 'Completada' },
  { title: 'Diseñar dashboard principal', priority: 'Alta', status: 'En progreso' },
  { title: 'Implementar políticas RLS', priority: 'Alta', status: 'Pendiente' },
  { title: 'Crear formulario de proyectos', priority: 'Media', status: 'Pendiente' },
]

function Brand() {
  return <Link className="brand" to="/dashboard"><span className="brand-mark"><Code2 size={19} /></span><span>Dev<span>Hub</span></span></Link>
}

function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const initials = username.slice(0, 2).toUpperCase()
  const handleSignOut = async () => { await signOut(); navigate('/login', { replace: true }) }

  return <aside className="sidebar">
    <Brand />
    <nav>
      <Link className={`nav-link ${location.pathname !== '/settings' ? 'active' : ''}`} to="/dashboard"><LayoutDashboard size={18} /> Proyectos</Link>
      <a className="nav-link" href="#tasks"><ListTodo size={18} /> Mis tareas</a>
      <Link className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`} to="/settings"><SettingsIcon size={18} /> Configuración</Link>
    </nav>
    <div className="sidebar-bottom">
      <div className="user"><div className="avatar">{initials}</div><div><strong>{username}</strong><span>{user?.email}</span></div></div>
      <button className="logout" type="button" onClick={handleSignOut}><LogOut size={17} /> Cerrar sesión</button>
    </div>
  </aside>
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><Sidebar /><main className="main">{children}</main></div>
}

function Dashboard() {
  const { user } = useAuth()
  const username = user?.user_metadata.username || user?.email?.split('@')[0] || 'Developer'
  const today = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()).toUpperCase()
  return <Shell>
    <header className="topbar"><div><p className="eyebrow">{today}</p><h1>Buenos días, {username} <span>👋</span></h1><p>Todo lo que estás construyendo, en un solo lugar.</p></div><Link className="button primary" to="/projects/new"><Plus size={18} /> Nuevo proyecto</Link></header>
    <section className="stats">
      <article><span className="stat-icon blue"><FolderKanban /></span><div><strong>4</strong><p>Proyectos totales</p></div></article>
      <article><span className="stat-icon green"><Rocket /></span><div><strong>2</strong><p>En progreso</p></div></article>
      <article><span className="stat-icon violet"><CheckCircle2 /></span><div><strong>18</strong><p>Tareas completadas</p></div></article>
    </section>
    <section className="section-head"><div><h2>Tus proyectos</h2><p>Continúa donde lo dejaste.</p></div><label className="search"><Search size={17} /><input aria-label="Buscar proyectos" placeholder="Buscar proyecto..." /></label></section>
    <section className="project-grid">
      {projects.map(project => <Link to={`/projects/${project.id}`} className="project-card" key={project.id}>
        <div className="card-top"><span className={`project-symbol ${project.tone}`}><Code2 /></span><span className={`badge ${project.tone}`}><i />{project.status}</span></div>
        <h3>{project.name}</h3><p>{project.description}</p>
        <div className="tech-list">{project.tech.map(item => <span key={item}>{item}</span>)}</div>
        <div className="progress-label"><span>Progreso</span><strong>{project.done}/{project.total} tareas</strong></div>
        <div className="progress"><i style={{ width: `${project.total ? project.done / project.total * 100 : 0}%` }} /></div>
        <div className="card-footer"><span>Actualizado {project.updated.toLowerCase()}</span><ArrowRight size={18} /></div>
      </Link>)}
      <Link to="/projects/new" className="new-card"><span><Plus /></span><strong>Crear nuevo proyecto</strong><p>Convierte esa idea en algo real.</p></Link>
    </section>
  </Shell>
}

function ProjectPage() {
  const { projectId } = useParams()
  const project = projects.find(item => item.id === projectId) ?? projects[0]
  return <Shell><div className="page-wrap">
    <Link className="back" to="/dashboard">← Volver a proyectos</Link>
    <div className="project-title"><div><div className="title-row"><span className="project-symbol green"><Code2 /></span><div><span className="badge green"><i />{project.status}</span><h1>{project.name}</h1></div></div><p>{project.description}</p></div><button className="button"><Github size={18} /> Repositorio</button></div>
    <div className="tabs"><button className="active">Resumen</button><button>Tareas <span>4</span></button></div>
    <div className="project-layout"><section>
      <div className="panel"><div className="panel-head"><div><h2>Tareas recientes</h2><p>El próximo paso siempre visible.</p></div><button className="button small"><Plus size={16} /> Nueva tarea</button></div>
        <div className="task-list">{tasks.map(task => <div className="task" key={task.title}><button aria-label={`Completar ${task.title}`} className={task.status === 'Completada' ? 'task-check checked' : 'task-check'}>{task.status === 'Completada' && '✓'}</button><div><strong>{task.title}</strong><span>{task.status}</span></div><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div>)}</div>
      </div>
    </section><aside className="details">
      <div className="panel"><h3>Progreso</h3><div className="big-progress"><strong>{Math.round(project.done / project.total * 100)}%</strong><span>completado</span></div><div className="progress"><i style={{ width: `${project.done / project.total * 100}%` }} /></div><p>{project.done} de {project.total} tareas completadas</p></div>
      <div className="panel"><h3>Tecnologías</h3><div className="tech-list large">{project.tech.map(item => <span key={item}>{item}</span>)}</div></div>
    </aside></div>
  </div></Shell>
}

function NewProject() {
  const navigate = useNavigate()
  return <Shell><div className="form-page"><Link className="back" to="/dashboard">← Cancelar y volver</Link><div className="form-heading"><span className="stat-icon blue"><Sparkles /></span><div><h1>Nuevo proyecto</h1><p>Dale un hogar a tu próxima gran idea.</p></div></div>
    <form className="project-form" onSubmit={event => { event.preventDefault(); navigate('/dashboard') }}>
      <label>Nombre del proyecto<input required placeholder="Ej. DevTrack" /></label>
      <label>Descripción<textarea rows={4} placeholder="¿Qué estás construyendo y por qué?" /></label>
      <div className="form-row"><label>Estado<select defaultValue="idea"><option value="idea">Idea</option><option value="in_progress">En progreso</option><option value="paused">Pausado</option><option value="completed">Terminado</option></select></label><label>Tecnologías<input placeholder="React, TypeScript, Supabase" /></label></div>
      <div className="form-row"><label>Repositorio<input type="url" placeholder="https://github.com/..." /></label><label>URL pública<input type="url" placeholder="https://..." /></label></div>
      <div className="form-actions"><Link className="button" to="/dashboard">Cancelar</Link><button className="button primary" type="submit">Crear proyecto <ArrowRight size={17} /></button></div>
    </form></div></Shell>
}

function SettingsPage() {
  const { user, updateEmail, updatePassword } = useAuth()
  const location = useLocation()
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
    supabase.from('profiles').select('username, email').eq('id', user.id).single().then(({ data }) => {
      if (data?.username) setUsername(data.username)
      if (data?.email) setEmail(data.email)
    })
  }, [user])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setProfileMessage(''); setSavingProfile(true)
    try {
      if (!user || username.trim().length < 2) throw new Error('El nombre debe tener al menos 2 caracteres.')
      const { error: profileError } = await supabase.from('profiles').update({ username: username.trim(), updated_at: new Date().toISOString() }).eq('id', user.id)
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
    <div className="settings-grid"><form className="settings-card" onSubmit={saveProfile}><div className="settings-card-title"><span><UserRound /></span><div><h2>Perfil</h2><p>La información que identifica tu cuenta.</p></div></div><label>Nombre<input value={username} onChange={event => setUsername(event.target.value)} /></label><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} /></label>{profileMessage && <div className="form-message success">{profileMessage}</div>}<button className="button primary" disabled={savingProfile}><Save size={17} /> {savingProfile ? 'Guardando...' : 'Guardar cambios'}</button></form>
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
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} /><Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} /><Route path="/projects/:projectId" element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>
}
