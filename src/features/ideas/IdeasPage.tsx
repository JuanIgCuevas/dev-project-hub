import { Archive, ArrowRight, Lightbulb, Pencil, Plus, Rocket, Save, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Idea, IdeaStatus } from '../../types/database'
import { useConvertIdeaToProject, useCreateIdea, useDeleteIdea, useIdeas, useUpdateIdea } from './ideaApi'
import type { IdeaInput } from './ideaApi'

const statusInfo: Record<IdeaStatus, { label: string; className: string }> = {
  inbox: { label: 'Nueva', className: 'new' },
  considering: { label: 'Para evaluar', className: 'considering' },
  archived: { label: 'Archivada', className: 'archived' },
}

function IdeaForm({ idea, onClose }: { idea?: Idea; onClose: () => void }) {
  const createIdea = useCreateIdea()
  const updateIdea = useUpdateIdea()
  const [title, setTitle] = useState(idea?.title ?? '')
  const [description, setDescription] = useState(idea?.description ?? '')
  const [technologies, setTechnologies] = useState(idea?.technologies.join(', ') ?? '')
  const [status, setStatus] = useState<IdeaStatus>(idea?.status ?? 'inbox')
  const [error, setError] = useState('')
  const isSaving = createIdea.isPending || updateIdea.isPending

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!title.trim()) { setError('Escribí un título para la idea.'); return }
    const input: IdeaInput = {
      title: title.trim(),
      description: description.trim(),
      technologies: technologies.split(',').map(item => item.trim()).filter(Boolean),
      status,
    }
    try {
      if (idea) await updateIdea.mutateAsync({ id: idea.id, input })
      else await createIdea.mutateAsync(input)
      onClose()
    } catch {
      setError('No pudimos guardar la idea. Intentá nuevamente.')
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="task-modal idea-modal" role="dialog" aria-modal="true" aria-labelledby="idea-form-title"><div className="modal-head"><div><p className="eyebrow">{idea ? 'EDITAR IDEA' : 'CAPTURAR IDEA'}</p><h2 id="idea-form-title">{idea ? 'Actualizar idea' : '¿Qué querés construir?'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X /></button></div><form onSubmit={save}><label>Título<input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} autoFocus placeholder="Ej. App para organizar recetas" /></label><label>Descripción<textarea value={description} onChange={event => setDescription(event.target.value)} rows={5} placeholder="Problema, posibles usuarios, funciones que imaginás..." /></label><div className="form-row"><label>Tecnologías<input value={technologies} onChange={event => setTechnologies(event.target.value)} placeholder="React, Supabase, IA" /></label><label>Estado<select value={status} onChange={event => setStatus(event.target.value as IdeaStatus)}><option value="inbox">Nueva</option><option value="considering">Para evaluar</option><option value="archived">Archivada</option></select></label></div>{error && <div className="form-message error" role="alert">{error}</div>}<div className="form-actions"><button className="button" type="button" onClick={onClose}>Cancelar</button><button className="button primary" disabled={isSaving}><Save size={17} /> {isSaving ? 'Guardando...' : 'Guardar idea'}</button></div></form></section></div>
}

export function IdeasPage() {
  const navigate = useNavigate()
  const { data: ideas = [], isLoading, error } = useIdeas()
  const updateIdea = useUpdateIdea()
  const deleteIdea = useDeleteIdea()
  const convertIdea = useConvertIdeaToProject()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | IdeaStatus>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | undefined>()
  const [actionError, setActionError] = useState('')
  const visibleIdeas = ideas.filter(idea => {
    const text = `${idea.title} ${idea.description ?? ''} ${idea.technologies.join(' ')}`.toLowerCase()
    return text.includes(search.trim().toLowerCase()) && (statusFilter === 'all' || idea.status === statusFilter)
  })

  const openForm = (idea?: Idea) => { setEditingIdea(idea); setFormOpen(true); setActionError('') }
  const closeForm = () => { setEditingIdea(undefined); setFormOpen(false) }
  const changeStatus = async (idea: Idea, status: IdeaStatus) => {
    setActionError('')
    try { await updateIdea.mutateAsync({ id: idea.id, input: { title: idea.title, description: idea.description ?? '', technologies: idea.technologies, status } }) }
    catch { setActionError('No pudimos cambiar el estado de la idea.') }
  }
  const removeIdea = async (idea: Idea) => {
    if (!window.confirm(`¿Eliminar la idea “${idea.title}”?`)) return
    setActionError('')
    try { await deleteIdea.mutateAsync(idea.id) }
    catch { setActionError('No pudimos eliminar la idea.') }
  }
  const convertToProject = async (idea: Idea) => {
    setActionError('')
    if (idea.converted_project_id) { navigate(`/projects/${idea.converted_project_id}`); return }
    try {
      const project = await convertIdea.mutateAsync(idea.id)
      navigate(`/projects/${project.id}`)
    } catch {
      setActionError('No pudimos convertir la idea en proyecto.')
    }
  }

  return <div className="ideas-page"><header className="ideas-heading"><div><p className="eyebrow">BANDEJA DE IDEAS</p><h1>Ideas para después</h1><p>Guardá lo que se te ocurre antes de que se pierda.</p></div><button className="button primary" onClick={() => openForm()}><Plus size={18} /> Nueva idea</button></header><section className="idea-summary"><article><Lightbulb /><div><strong>{ideas.filter(idea => idea.status === 'inbox').length}</strong><span>Nuevas</span></div></article><article><Sparkles /><div><strong>{ideas.filter(idea => idea.status === 'considering').length}</strong><span>Para evaluar</span></div></article><article><Archive /><div><strong>{ideas.filter(idea => idea.status === 'archived').length}</strong><span>Archivadas</span></div></article></section><section className="idea-filters"><label className="search"><Search size={17} /><input aria-label="Buscar ideas" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por título, detalle o tecnología..." /></label><select aria-label="Filtrar ideas por estado" value={statusFilter} onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}><option value="all">Todos los estados</option><option value="inbox">Nuevas</option><option value="considering">Para evaluar</option><option value="archived">Archivadas</option></select></section>{actionError && <div className="form-message error" role="alert">{actionError}</div>}{isLoading && <div className="content-state"><span className="mini-loader" /><p>Cargando ideas...</p></div>}{error && <div className="content-state error-state"><p>No pudimos cargar tus ideas.</p></div>}{!isLoading && !error && <section className="ideas-grid">{visibleIdeas.map(idea => { const status = idea.converted_project_id ? { label: 'Convertida', className: 'converted' } : statusInfo[idea.status]; return <article className="idea-card" key={idea.id}><div className="idea-card-top"><span className="idea-bulb"><Lightbulb /></span><span className={`idea-status ${status.className}`}>{status.label}</span></div><h2>{idea.title}</h2><p>{idea.description || 'Sin descripción todavía.'}</p><div className="tech-list">{idea.technologies.length ? idea.technologies.map(technology => <span key={technology}>{technology}</span>) : <span>Stack por definir</span>}</div><button className={`idea-project-action ${idea.converted_project_id ? 'converted' : ''}`} type="button" onClick={() => convertToProject(idea)} disabled={convertIdea.isPending && convertIdea.variables === idea.id}>{idea.converted_project_id ? <><Rocket size={15} /> Ver proyecto <ArrowRight size={14} /></> : <><Rocket size={15} /> {convertIdea.isPending && convertIdea.variables === idea.id ? 'Creando proyecto...' : 'Convertir en proyecto'}</>}</button><div className="idea-card-footer"><select value={idea.status} disabled={Boolean(idea.converted_project_id)} onChange={event => changeStatus(idea, event.target.value as IdeaStatus)} aria-label={`Estado de ${idea.title}`}><option value="inbox">Nueva</option><option value="considering">Para evaluar</option><option value="archived">Archivada</option></select><div className="task-actions"><button className="icon-button" onClick={() => openForm(idea)} aria-label={`Editar ${idea.title}`}><Pencil /></button><button className="icon-button danger-icon" onClick={() => removeIdea(idea)} aria-label={`Eliminar ${idea.title}`}><Trash2 /></button></div></div></article>})}{visibleIdeas.length === 0 && <div className="ideas-empty"><Lightbulb /><h2>{ideas.length ? 'No encontramos ideas' : 'Tu próxima gran idea empieza acá'}</h2><p>{ideas.length ? 'Probá cambiando la búsqueda o los filtros.' : 'Anotá cualquier concepto, aunque todavía no esté definido.'}</p>{ideas.length === 0 && <button className="button primary" onClick={() => openForm()}><Plus size={17} /> Anotar primera idea</button>}</div>}</section>}{formOpen && <IdeaForm idea={editingIdea} onClose={closeForm} />}</div>
}
