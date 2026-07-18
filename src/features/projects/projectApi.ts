import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Project, ProjectStatus, Task } from '../../types/database'

export interface ProjectInput {
  name: string
  description: string
  status: ProjectStatus
  technologies: string[]
  repository_url: string | null
  live_url: string | null
}

export interface ProjectWithTasks extends Project {
  tasks: Pick<Task, 'id' | 'status'>[]
}

export interface ProjectDetails extends Project {
  tasks: Task[]
}

const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

async function getProjects() {
  const { data, error } = await supabase.rpc('api_list_projects')
  if (error) throw error
  return (data ?? []) as ProjectWithTasks[]
}

async function getProject(id: string) {
  const { data, error } = await supabase.rpc('api_get_project', { p_project_id: id })
  if (error) throw error
  return data as ProjectDetails
}

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: getProjects })
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: () => getProject(id!),
    enabled: Boolean(id),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ input, userId }: { input: ProjectInput; userId: string }) => {
      if (!userId) throw new Error('Authentication required')
      const { data, error } = await supabase.rpc('api_create_project', {
        p_name: input.name,
        p_description: input.description,
        p_status: input.status,
        p_technologies: input.technologies,
        p_repository_url: input.repository_url ?? '',
        p_live_url: input.live_url ?? '',
      })
      if (error) throw error
      return data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProjectInput }) => {
      const { data, error } = await supabase.rpc('api_update_project', {
        p_project_id: id,
        p_name: input.name,
        p_description: input.description,
        p_status: input.status,
        p_technologies: input.technologies,
        p_repository_url: input.repository_url ?? '',
        p_live_url: input.live_url ?? '',
      })
      if (error) throw error
      return data as Project
    },
    onSuccess: project => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('api_delete_project', { p_project_id: id })
      if (error) throw error
      return id
    },
    onSuccess: id => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}
