create table public.focus_sessions (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  task_ids uuid[] not null default '{}',
  task_titles text[] not null default '{}',
  planned_seconds integer not null check (planned_seconds > 0),
  focused_seconds integer not null check (focused_seconds >= 0),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  completion_reason text not null check (completion_reason in ('timer', 'manual')),
  outcome text,
  pending text,
  next_step text,
  rating smallint check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index focus_sessions_project_completed_idx on public.focus_sessions(project_id, completed_at desc);
create index focus_sessions_user_completed_idx on public.focus_sessions(user_id, completed_at desc);

alter table public.focus_sessions enable row level security;

create policy "Focus sessions belong to their owner" on public.focus_sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

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
    focused_seconds = excluded.focused_seconds,
    completed_at = excluded.completed_at,
    completion_reason = excluded.completion_reason,
    outcome = excluded.outcome,
    pending = excluded.pending,
    next_step = excluded.next_step,
    rating = excluded.rating,
    updated_at = now()
  where public.focus_sessions.user_id = auth.uid()
  returning * into saved_session;

  if saved_session.id is null then
    raise exception 'Focus session not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(saved_session) - 'user_id';
end;
$$;

create or replace function public.api_list_project_focus_sessions(p_project_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(to_jsonb(session_row) - 'user_id' order by session_row.completed_at desc), '[]'::jsonb)
  from public.focus_sessions session_row
  where session_row.project_id = p_project_id
    and session_row.user_id = auth.uid()
    and exists(select 1 from public.projects where id = p_project_id and user_id = auth.uid());
$$;

revoke all on public.focus_sessions from public, anon, authenticated;
revoke all on function public.api_save_focus_session(uuid,uuid,uuid[],text[],integer,integer,timestamptz,timestamptz,text,text,text,text,smallint) from public, anon;
revoke all on function public.api_list_project_focus_sessions(uuid) from public, anon;
grant execute on function public.api_save_focus_session(uuid,uuid,uuid[],text[],integer,integer,timestamptz,timestamptz,text,text,text,text,smallint) to authenticated;
grant execute on function public.api_list_project_focus_sessions(uuid) to authenticated;

