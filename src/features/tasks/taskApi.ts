import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Task, TaskPriority, TaskStatus } from '../../types/database'

export interface TaskInput {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
}

function useRefreshProjects() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['projects'] })
}

export function useCreateTask() {
  const refresh = useRefreshProjects()
  return useMutation({
    mutationFn: async ({ projectId, input }: { projectId: string; input: TaskInput }) => {
      const { data, error } = await supabase.rpc('api_create_task', {
        p_project_id: projectId,
        p_title: input.title,
        p_description: input.description,
        p_status: input.status,
        p_priority: input.priority,
        p_due_date: input.due_date,
      })
      if (error) throw error
      return data as Task
    },
    onSuccess: refresh,
  })
}

export function useUpdateTask() {
  const refresh = useRefreshProjects()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TaskInput }) => {
      const { data, error } = await supabase.rpc('api_update_task', {
        p_task_id: id,
        p_title: input.title,
        p_description: input.description,
        p_status: input.status,
        p_priority: input.priority,
        p_due_date: input.due_date,
      })
      if (error) throw error
      return data as Task
    },
    onSuccess: refresh,
  })
}

export function useUpdateTaskStatus() {
  const refresh = useRefreshProjects()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase.rpc('api_update_task_status', {
        p_task_id: id,
        p_status: status,
      })
      if (error) throw error
      return data as Task
    },
    onSuccess: refresh,
  })
}

export function useDeleteTask() {
  const refresh = useRefreshProjects()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('api_delete_task', { p_task_id: id })
      if (error) throw error
      return id
    },
    onSuccess: refresh,
  })
}
