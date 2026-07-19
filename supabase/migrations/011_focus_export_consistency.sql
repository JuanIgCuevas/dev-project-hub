create or replace function public.api_save_focus_session(
  p_session_id uuid,
  p_project_id uuid,
  p_task_ids uuid[],
  p_task_titles text[],
  p_planned_seconds integer,
  p_focused_seconds integer,
  p_started_at timestamptz,
  p_completed_at timestamptz,
  p_completion_reason text,
  p_outcome text,
  p_pending text,
  p_next_step text,
  p_rating smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare saved_session public.focus_sessions%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists(select 1 from public.projects where id = p_project_id and user_id = auth.uid()) then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;
  if p_planned_seconds <= 0 or p_focused_seconds < 0 then
    raise exception 'Invalid focus duration' using errcode = '22023';
  end if;
  if p_completion_reason not in ('timer', 'manual') then
    raise exception 'Invalid completion reason' using errcode = '22023';
  end if;
  if p_rating is not null and p_rating not between 1 and 5 then
    raise exception 'Invalid focus rating' using errcode = '22023';
  end if;

  insert into public.focus_sessions(
    id, project_id, user_id, task_ids, task_titles, planned_seconds, focused_seconds,
    started_at, completed_at, completion_reason, outcome, pending, next_step, rating
  ) values (
    p_session_id, p_project_id, auth.uid(), coalesce(p_task_ids, '{}'), coalesce(p_task_titles, '{}'),
    p_planned_seconds, p_focused_seconds, p_started_at, p_completed_at, p_completion_reason,
    nullif(trim(p_outcome), ''), nullif(trim(p_pending), ''), nullif(trim(p_next_step), ''), p_rating
  )
  on conflict(id) do update set
    focused_seconds = greatest(public.focus_sessions.focused_seconds, excluded.focused_seconds),
    completed_at = greatest(public.focus_sessions.completed_at, excluded.completed_at),
    completion_reason = excluded.completion_reason,
    outcome = coalesce(excluded.outcome, public.focus_sessions.outcome),
    pending = coalesce(excluded.pending, public.focus_sessions.pending),
    next_step = coalesce(excluded.next_step, public.focus_sessions.next_step),
    rating = coalesce(excluded.rating, public.focus_sessions.rating),
    updated_at = now()
  where public.focus_sessions.user_id = auth.uid()
  returning * into saved_session;

  if saved_session.id is null then
    raise exception 'Focus session not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(saved_session) - 'user_id';
end;
$$;

create or replace function public.api_export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(profile_row) from public.profiles profile_row where profile_row.id=auth.uid()),
    'projects', coalesce((
      select jsonb_agg(
        to_jsonb(project_row)
        || jsonb_build_object('tasks', coalesce((select jsonb_agg(to_jsonb(task_row) order by task_row.created_at) from public.tasks task_row where task_row.project_id=project_row.id), '[]'::jsonb))
        || jsonb_build_object('events', coalesce((select jsonb_agg(to_jsonb(event_row) order by event_row.created_at) from public.project_events event_row where event_row.project_id=project_row.id), '[]'::jsonb))
        || jsonb_build_object('decisions', coalesce((select jsonb_agg(to_jsonb(decision_row) order by decision_row.created_at) from public.project_decisions decision_row where decision_row.project_id=project_row.id), '[]'::jsonb))
        || jsonb_build_object('ship_checklist', coalesce((select checklist_row.checks from public.project_ship_checklists checklist_row where checklist_row.project_id=project_row.id), '{}'::jsonb))
        || jsonb_build_object('focus_sessions', coalesce((select jsonb_agg(to_jsonb(focus_row) - 'user_id' order by focus_row.completed_at) from public.focus_sessions focus_row where focus_row.project_id=project_row.id), '[]'::jsonb))
        order by project_row.created_at
      ) from public.projects project_row where project_row.user_id=auth.uid()
    ), '[]'::jsonb),
    'ideas', coalesce((select jsonb_agg(to_jsonb(idea_row) order by idea_row.created_at) from public.ideas idea_row where idea_row.user_id=auth.uid()), '[]'::jsonb)
  );
$$;

