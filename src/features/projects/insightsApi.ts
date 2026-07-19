import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { ProjectDecision, ProjectEvent } from '../../types/database'

export type ShipChecks = Record<'readme' | 'responsive' | 'security' | 'tests' | 'screenshots' | 'portfolio', boolean>

export interface ProjectInsights {
  events: ProjectEvent[]
  decisions: ProjectDecision[]
  checklist: Partial<ShipChecks>
}

const insightsKey = (projectId: string) => ['project-insights', projectId] as const

export function useProjectInsights(projectId: string) {
  return useQuery({
    queryKey: insightsKey(projectId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('api_list_project_insights', { p_project_id: projectId })
      if (error) throw error
      return data as ProjectInsights
    },
  })
}

function useRefreshInsights(projectId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: insightsKey(projectId) })
}

export function useAddProjectNote(projectId: string) {
  const refresh = useRefreshInsights(projectId)
  return useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.rpc('api_add_project_note', { p_project_id: projectId, p_title: title })
      if (error) throw error
      return data as ProjectEvent
    },
    onSuccess: refresh,
  })
}

export function useCreateDecision(projectId: string) {
  const refresh = useRefreshInsights(projectId)
  return useMutation({
    mutationFn: async (input: { title: string; context: string; decision: string }) => {
      const { data, error } = await supabase.rpc('api_create_project_decision', {
        p_project_id: projectId,
        p_title: input.title,
        p_context: input.context,
        p_decision: input.decision,
      })
      if (error) throw error
      return data as ProjectDecision
    },
    onSuccess: refresh,
  })
}

export function useDeleteDecision(projectId: string) {
  const refresh = useRefreshInsights(projectId)
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('api_delete_project_decision', { p_decision_id: id })
      if (error) throw error
    },
    onSuccess: refresh,
  })
}

export function useUpdateShipChecklist(projectId: string) {
  const refresh = useRefreshInsights(projectId)
  return useMutation({
    mutationFn: async (checks: ShipChecks) => {
      const { data, error } = await supabase.rpc('api_update_ship_checklist', { p_project_id: projectId, p_checks: checks })
      if (error) throw error
      return data as ShipChecks
    },
    onSuccess: refresh,
  })
}
