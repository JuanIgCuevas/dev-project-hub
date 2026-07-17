import { ArrowRight, CheckCircle2, Code2, FolderKanban, Github, LayoutDashboard, ListTodo, LogOut, Plus, Rocket, Search, Sparkles } from 'lucide-react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

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
  return <aside className="sidebar">
    <Brand />
    <nav>
      <Link className="nav-link active" to="/dashboard"><LayoutDashboard size={18} /> Proyectos</Link>
      <a className="nav-link" href="#tasks"><ListTodo size={18} /> Mis tareas</a>
    </nav>
    <div className="sidebar-bottom">
      <div className="user"><div className="avatar">JD</div><div><strong>Juan Developer</strong><span>juan@dev.com</span></div></div>
      <Link className="logout" to="/login"><LogOut size={17} /> Cerrar sesión</Link>
    </div>
  </aside>
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell"><Sidebar /><main className="main">{children}</main></div>
}

function Dashboard() {
  return <Shell>
    <header className="topbar"><div><p className="eyebrow">VIERNES, 17 DE JULIO</p><h1>Buenos días, Juan <span>👋</span></h1><p>Todo lo que estás construyendo, en un solo lugar.</p></div><Link className="button primary" to="/projects/new"><Plus size={18} /> Nuevo proyecto</Link></header>
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

function Login() {
  return <div className="auth-page"><div className="auth-copy"><Brand /><div><span className="auth-label"><Sparkles size={15} /> CONSTRUYE CON INTENCIÓN</span><h1>Tus ideas merecen<br /><em>llegar a producción.</em></h1><p>Organiza tus proyectos, mantén el foco y convierte tu próximo side project en algo real.</p></div><blockquote>“La herramienta que necesitaba para dejar de abandonar proyectos a mitad de camino.”<footer>— Un developer con demasiadas ideas</footer></blockquote></div>
    <div className="auth-panel"><form className="auth-form"><h2>Bienvenido de nuevo</h2><p>Continúa construyendo donde lo dejaste.</p><label>Email<input type="email" defaultValue="demo@devhub.app" /></label><label>Contraseña<input type="password" defaultValue="demopassword" /></label><Link className="button primary wide" to="/dashboard">Iniciar sesión <ArrowRight size={18} /></Link><div className="divider"><span>o</span></div><button className="button wide" type="button"><Github size={19} /> Continuar con GitHub</button><p className="auth-switch">¿No tienes cuenta? <Link to="/register">Crea una gratis</Link></p></form></div>
  </div>
}

export function App() {
  return <Routes><Route path="/login" element={<Login />} /><Route path="/register" element={<Login />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/projects/new" element={<NewProject />} /><Route path="/projects/:projectId" element={<ProjectPage />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>
}
