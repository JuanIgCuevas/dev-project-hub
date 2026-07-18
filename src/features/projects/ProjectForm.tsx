import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../auth/AuthProvider'
import { useCreateProject, useUpdateProject } from './projectApi'
import type { Project, ProjectStatus } from '../../types/database'

const optionalUrl = z.string().trim().refine(value => !value || z.url().safeParse(value).success, 'Ingresá una URL válida.')
const projectSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá al menos 2 caracteres.').max(100),
  description: z.string().trim().max(1000),
  status: z.enum(['idea', 'in_progress', 'paused', 'completed']),
  technologies: z.string().trim(),
  repository_url: optionalUrl,
  live_url: optionalUrl,
})
type ProjectFormValues = z.infer<typeof projectSchema>

export function ProjectForm({ project }: { project?: Project }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', status: 'idea', technologies: '', repository_url: '', live_url: '' },
  })

  useEffect(() => {
    if (!project) return
    reset({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      technologies: project.technologies.join(', '),
      repository_url: project.repository_url ?? '',
      live_url: project.live_url ?? '',
    })
  }, [project, reset])

  const onSubmit = async (values: ProjectFormValues) => {
    setServerError('')
    if (!user) return
    const input = {
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status as ProjectStatus,
      technologies: values.technologies.split(',').map(item => item.trim()).filter(Boolean),
      repository_url: values.repository_url || null,
      live_url: values.live_url || null,
    }
    try {
      const saved = project
        ? await updateProject.mutateAsync({ id: project.id, input })
        : await createProject.mutateAsync({ input, userId: user.id })
      navigate(`/projects/${saved.id}`, { replace: true })
    } catch {
      setServerError('No pudimos guardar el proyecto. Revisá los datos e intentá nuevamente.')
    }
  }

  return <form className="project-form" onSubmit={handleSubmit(onSubmit)} noValidate>
    <label>Nombre del proyecto<input {...register('name')} placeholder="Ej. DevTrack" /><small>{errors.name?.message}</small></label>
    <label>Descripción<textarea {...register('description')} rows={4} placeholder="¿Qué estás construyendo y por qué?" /><small>{errors.description?.message}</small></label>
    <div className="form-row"><label>Estado<select {...register('status')}><option value="idea">Idea</option><option value="in_progress">En progreso</option><option value="paused">Pausado</option><option value="completed">Terminado</option></select></label><label>Tecnologías<input {...register('technologies')} placeholder="React, TypeScript, Supabase" /><small>{errors.technologies?.message}</small></label></div>
    <div className="form-row"><label>Repositorio<input {...register('repository_url')} type="url" placeholder="https://github.com/..." /><small>{errors.repository_url?.message}</small></label><label>URL pública<input {...register('live_url')} type="url" placeholder="https://..." /><small>{errors.live_url?.message}</small></label></div>
    {serverError && <div className="form-message error" role="alert">{serverError}</div>}
    <div className="form-actions"><Link className="button" to={project ? `/projects/${project.id}` : '/dashboard'}>Cancelar</Link><button className="button primary" disabled={isSubmitting} type="submit">{isSubmitting ? 'Guardando...' : project ? 'Guardar cambios' : 'Crear proyecto'} {project ? <Save size={17} /> : <ArrowRight size={17} />}</button></div>
  </form>
}
