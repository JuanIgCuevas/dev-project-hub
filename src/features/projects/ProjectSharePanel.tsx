import { Check, Copy, ExternalLink, Globe2, Link2, LockKeyhole } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '../feedback/toastContext'
import type { ProjectDetails } from './projectApi'
import { useUpdateProjectPublication } from './projectApi'

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
}

function sanitizeSlugInput(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-/, '').slice(0, 80)
}

export function ProjectSharePanel({ project }: { project: ProjectDetails }) {
  const updatePublication = useUpdateProjectPublication()
  const { showToast } = useToast()
  const [slug, setSlug] = useState(project.public_slug || slugify(project.name))
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const publicUrl = project.public_slug ? `${window.location.origin}/showcase/${project.public_slug}` : ''

  useEffect(() => setSlug(project.public_slug || slugify(project.name)), [project.name, project.public_slug])

  const publish = async () => {
    setError('')
    const normalizedSlug = slugify(slug)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug) || normalizedSlug.length < 3 || normalizedSlug.length > 80) {
      setError('Usá entre 3 y 80 letras minúsculas, números o guiones.')
      return
    }
    try {
      await updatePublication.mutateAsync({ id: project.id, isPublic: true, slug: normalizedSlug })
      showToast(project.is_public ? 'Enlace público actualizado.' : 'Página pública activada.')
    } catch (publicationError) {
      const message = publicationError instanceof Error ? publicationError.message : ''
      setError(message.toLowerCase().includes('already') || message.includes('23505') ? 'Ese enlace ya está en uso. Probá con otro nombre.' : 'No pudimos publicar el proyecto. Verificá que la migración esté aplicada.')
    }
  }

  const unpublish = async () => {
    if (!window.confirm('¿Despublicar este proyecto? El enlace dejará de funcionar.')) return
    setError('')
    try {
      await updatePublication.mutateAsync({ id: project.id, isPublic: false })
      showToast('Proyecto despublicado.')
    } catch {
      setError('No pudimos despublicar el proyecto.')
    }
  }

  const copyUrl = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    showToast('Enlace copiado.')
    window.setTimeout(() => setCopied(false), 1800)
  }

  return <section className={`panel share-panel ${project.is_public ? 'is-public' : ''}`}>
    <div className="share-panel-heading"><span><Globe2 /></span><div><p className="eyebrow">PRESENTACIÓN PÚBLICA</p><h3>{project.is_public ? 'Tu proyecto está visible' : 'Compartí lo que construiste'}</h3></div><em>{project.is_public ? 'PUBLICADO' : 'PRIVADO'}</em></div>
    <p>Generá una página profesional para mostrar el proyecto, su stack y sus avances.</p>
    <div className="share-privacy-note"><LockKeyhole /><span>Solo se muestran datos del proyecto y tareas completadas. Tus notas, decisiones y fechas permanecen privadas.</span></div>
    <label>Dirección personalizada<div className="share-slug-input"><span>{window.location.host}/showcase/</span><input value={slug} onChange={event => setSlug(sanitizeSlugInput(event.target.value))} disabled={updatePublication.isPending} aria-label="Dirección pública del proyecto" /></div></label>
    {error && <div className="form-message error" role="alert">{error}</div>}
    <div className="share-panel-actions"><button className="button primary" type="button" onClick={publish} disabled={updatePublication.isPending}><Link2 /> {updatePublication.isPending ? 'Guardando...' : project.is_public ? 'Guardar enlace' : 'Activar página pública'}</button>{project.is_public && <><button className="button" type="button" onClick={copyUrl}>{copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar enlace'}</button><a className="button" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink /> Ver página</a><button className="button ghost-danger" type="button" onClick={unpublish} disabled={updatePublication.isPending}>Despublicar</button></>}</div>
  </section>
}
