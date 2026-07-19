import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { Idea, IdeaStatus, Project } from '../../types/database'

export interface IdeaInput {
  title: string
  description: string
  technologies: string[]
  status: IdeaStatus
  excitement: number
  usefulness: number
  difficulty: number
  portfolio_value: number
  estimated_hours: number
}

const ideaKeys = ['ideas'] as const

export function useIdeas() {
  return useQuery({
    queryKey: ideaKeys,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('api_list_ideas')
      if (error) throw error
      return (data ?? []) as Idea[]
    },
  })
}

export function useCreateIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: IdeaInput) => {
      const { data, error } = await supabase.rpc('api_create_idea', {
        p_title: input.title,
        p_description: input.description,
        p_technologies: input.technologies,
        p_status: input.status,
        p_excitement: input.excitement,
        p_usefulness: input.usefulness,
        p_difficulty: input.difficulty,
        p_portfolio_value: input.portfolio_value,
        p_estimated_hours: input.estimated_hours,
      })
      if (error) throw error
      return data as Idea
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideaKeys }),
  })
}

export function useUpdateIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: IdeaInput }) => {
      const { data, error } = await supabase.rpc('api_update_idea', {
        p_idea_id: id,
        p_title: input.title,
        p_description: input.description,
        p_technologies: input.technologies,
        p_status: input.status,
        p_excitement: input.excitement,
        p_usefulness: input.usefulness,
        p_difficulty: input.difficulty,
        p_portfolio_value: input.portfolio_value,
        p_estimated_hours: input.estimated_hours,
      })
      if (error) throw error
      return data as Idea
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideaKeys }),
  })
}

export function useDeleteIdea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('api_delete_idea', { p_idea_id: id })
      if (error) throw error
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ideaKeys }),
  })
}

export function useConvertIdeaToProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc('api_convert_idea_to_project', { p_idea_id: id })
      if (error) throw error
      return data as Project
    },
    onSuccess: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: ideaKeys }),
      queryClient.invalidateQueries({ queryKey: ['projects'] }),
    ]),
  })
}
