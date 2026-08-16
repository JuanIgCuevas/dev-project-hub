import { zodResolver } from '@hookform/resolvers/zod'
import { Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Task } from '../../types/database'
import { useCreateTask, useUpdateTask } from './taskApi'
import { useToast } from '../feedback/toastContext'

const taskSchema = z.object({
  title: z.string().trim().min(2, 'Ingresá al menos 2 caracteres.').max(160),
  description: z.string().trim().max(1000),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string(),
})
type TaskFormValues = z.infer<typeof taskSchema>

export function TaskForm({ projectId, task, onClose }: { projectId: string; task?: Task; onClose: () => void }) {
  const { showToast } = useToast()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '', status: 'todo', priority: 'medium', due_date: '' },
  })

  useEffect(() => {
    if (!task) return
    reset({
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? '',
    })
  }, [reset, task])

  const onSubmit = async (values: TaskFormValues) => {
    setServerError('')
    const input = {
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      due_date: values.due_date || null,
    }
    try {
      if (task) await updateTask.mutateAsync({ id: task.id, input })
      else await createTask.mutateAsync({ projectId, input })
      showToast(task ? 'Tarea actualizada correctamente.' : 'Tarea creada correctamente.')
      onClose()
    } catch {
      setServerError('No pudimos guardar la tarea. Intentá nuevamente.')
    }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-form-title"><div className="modal-head"><div><p className="eyebrow">{task ? 'EDITAR' : 'NUEVA'}</p><h2 id="task-form-title">{task ? 'Editar tarea' : 'Crear tarea'}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X /></button></div>
    <form onSubmit={handleSubmit(onSubmit)} noValidate><label>Título<input autoFocus {...register('title')} placeholder="Ej. Diseñar página principal" /><small>{errors.title?.message}</small></label><label>Descripción<textarea {...register('description')} rows={3} placeholder="Agregá el contexto necesario..." /><small>{errors.description?.message}</small></label>
      <div className="form-row"><label>Estado<select {...register('status')}><option value="todo">Pendiente</option><option value="in_progress">En progreso</option><option value="done">Completada</option></select></label><label>Prioridad<select {...register('priority')}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select></label></div>
      <label>Fecha límite<input type="date" {...register('due_date')} /></label>{serverError && <div className="form-message error" role="alert">{serverError}</div>}<div className="form-actions"><button className="button" type="button" onClick={onClose}>Cancelar</button><button className="button primary" disabled={isSubmitting}><Save size={17} /> {isSubmitting ? 'Guardando...' : 'Guardar tarea'}</button></div>
    </form></section></div>
}
