import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { FocusSessionRecord } from '../../types/database'
import type { FocusSession, FocusSessionReflection } from './focusContext'

export const focusSessionKey = (projectId: string) => ['focus-sessions', projectId] as const
export const myFocusSessionsKey = ['focus-sessions', 'mine'] as const

export interface FocusSessionWithProject extends FocusSessionRecord {
  project_name: string
}

export interface FocusSessionEditInput {
  taskTitles: string[]
  outcome: string
  pending: string
  nextStep: string
  rating: number | null
}

export async function saveFocusSession(session: FocusSession, reflection?: FocusSessionReflection) {
  const focusedSeconds = Math.max(0, session.durationSeconds - session.remainingSeconds)
  const { data, error } = await supabase.rpc('api_save_focus_session', {
    p_session_id: session.id,
    p_project_id: session.projectId,
    p_task_ids: session.taskIds,
    p_task_titles: session.taskTitles,
    p_planned_seconds: session.durationSeconds,
    p_focused_seconds: focusedSeconds,
    p_started_at: new Date(session.startedAt).toISOString(),
    p_completed_at: new Date(session.completedAt ?? Date.now()).toISOString(),
    p_completion_reason: session.completionReason ?? 'manual',
    p_outcome: reflection?.outcome ?? '',
    p_pending: reflection?.pending ?? '',
    p_next_step: reflection?.nextStep ?? '',
    p_rating: reflection?.rating ?? null,
  })
  if (error) throw error
  return data as FocusSessionRecord
}

export function useProjectFocusSessions(projectId: string) {
  return useQuery({
    queryKey: focusSessionKey(projectId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('api_list_project_focus_sessions', { p_project_id: projectId })
      if (error) throw error
      return (data ?? []) as FocusSessionRecord[]
    },
  })
}

export function useSaveFocusReflection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ session, reflection }: { session: FocusSession; reflection: FocusSessionReflection }) => saveFocusSession(session, reflection),
    onSuccess: saved => {
      queryClient.invalidateQueries({ queryKey: focusSessionKey(saved.project_id) })
      queryClient.invalidateQueries({ queryKey: myFocusSessionsKey })
    },
  })
}

export function useUpdateFocusSession(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: FocusSessionEditInput }) => {
      const { data, error } = await supabase.rpc('api_update_focus_session', {
        p_session_id: id,
        p_task_titles: input.taskTitles,
        p_outcome: input.outcome,
        p_pending: input.pending,
        p_next_step: input.nextStep,
        p_rating: input.rating,
      })
      if (error) throw error
      return data as FocusSessionRecord
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: focusSessionKey(projectId) })
      queryClient.invalidateQueries({ queryKey: myFocusSessionsKey })
    },
  })
}

export function useDeleteFocusSession(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('api_delete_focus_session', { p_session_id: id })
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: focusSessionKey(projectId) })
      queryClient.invalidateQueries({ queryKey: myFocusSessionsKey })
    },
  })
}

export function useMyFocusSessions(enabled = true) {
  return useQuery({
    queryKey: myFocusSessionsKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('api_list_my_focus_sessions', { p_limit: 50 })
      if (error) throw error
      return (data ?? []) as FocusSessionWithProject[]
    },
    enabled,
  })
}
