import { ArrowRight, CheckCircle2, Code2, ExternalLink, Github, Languages, Moon, Rocket, Sun } from 'lucide-react'
import { useEffect, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '../../components/UiStates'
import { usePreferences } from '../preferences/preferencesContext'
import { useTheme } from '../theme/themeContext'
import { usePublicProject } from './projectApi'
import { safeExternalUrl } from '../../lib/externalUrl'

const statusLabels = { idea: 'Idea', in_progress: 'En progreso', paused: 'Pausado', completed: 'Terminado' }

export function PublicProjectPage() {
  const { slug } = useParams()
  const { data: project, isLoading, error } = usePublicProject(slug)
  const { preferences, updatePreference } = usePreferences()
  const { theme, toggleTheme } = useTheme()
  const progress = project?.total_tasks ? Math.round(project.completed_tasks / project.total_tasks * 100) : 0
  const liveUrl = safeExternalUrl(project?.live_url)
  const repositoryUrl = safeExternalUrl(project?.repository_url)

  useEffect(() => {
    if (!project) return
    const previousTitle = document.title
    document.title = `${project.name} — DevHub`
    return () => { document.title = previousTitle }
  }, [project])

  return <div className="public-project-page">
    <header className="public-project-nav"><Link className="brand" to="/demo"><span className="brand-mark">DH</span><span className="brand-copy"><span className="brand-name">Dev<span>Hub</span></span><small>BUILD SYSTEM · 2026</small></span></Link><div><label><Languages /><select aria-label="Idioma de la aplicación" value={preferences.language} onChange={event => updatePreference('language', event.target.value as 'es' | 'en')}><option value="es">ES</option><option value="en">EN</option></select></label><button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'}>{theme === 'dark' ? <Sun /> : <Moon />}</button><Link className="button primary" to="/register">Crear mi espacio <ArrowRight /></Link></div></header>
    {isLoading && <main className="public-project-state"><PageSkeleton variant="detail" label="Cargando presentación..." /></main>}
    {!isLoading && (error || !project) && <main className="public-project-state public-not-found"><Code2 /><p className="eyebrow">ENLACE NO DISPONIBLE</p><h1>Este proyecto no está publicado</h1><p>Es posible que el enlace haya cambiado o que su creador lo haya despublicado.</p><Link className="button primary" to="/demo">Conocer DevHub <ArrowRight /></Link></main>}
    {project && <main className="public-project-content"><section className="public-project-hero"><div><div className="public-project-kicker"><span><Code2 /></span><p className="eyebrow">PROYECTO DESTACADO · POR <b data-no-translate>{project.owner_name}</b></p></div><h1 data-no-translate>{project.name}</h1><p className="public-project-description" data-no-translate={project.description ? true : undefined}>{project.description || 'Un proyecto construido con intención, foco y mejora continua.'}</p><div className="public-project-links">{liveUrl && <a className="button primary" href={liveUrl} target="_blank" rel="noopener noreferrer"><Rocket /> Ver proyecto <ExternalLink /></a>}{repositoryUrl && <a className="button" href={repositoryUrl} target="_blank" rel="noopener noreferrer"><Github /> Ver repositorio</a>}</div></div><aside><span className="public-status"><i />{statusLabels[project.status]}</span><div className="public-progress-ring" style={{ '--showcase-progress': `${progress * 3.6}deg` } as CSSProperties}><div><strong>{progress}%</strong><span>completado</span></div></div><p>{project.completed_tasks} de {project.total_tasks} tareas completadas</p></aside></section>
      <section className="public-project-grid"><article className="public-stack-card"><p className="eyebrow">TECNOLOGÍAS</p><h2>El stack detrás del proyecto</h2><div>{project.technologies.length ? project.technologies.map(item => <span data-no-translate key={item}>{item}</span>) : <p>Stack todavía no publicado.</p>}</div></article><article className="public-milestones-card"><p className="eyebrow">AVANCES</p><h2>Hitos completados</h2>{project.milestones.length ? <div>{project.milestones.map(milestone => <span key={milestone.id}><CheckCircle2 /><b data-no-translate>{milestone.title}</b></span>)}</div> : <p>Los próximos avances aparecerán acá.</p>}</article></section>
      <section className="public-project-cta"><div><p className="eyebrow">CREADO CON DEVHUB</p><h2>Las buenas ideas merecen llegar a producción.</h2><p>Organizá tus proyectos, mantené el foco y convertí el proceso en una historia que puedas mostrar.</p></div><div><Link className="button primary" to="/register">Crear mi espacio <ArrowRight /></Link><Link className="button" to="/demo">Ver demo interactiva</Link></div></section></main>}
  </div>
}
