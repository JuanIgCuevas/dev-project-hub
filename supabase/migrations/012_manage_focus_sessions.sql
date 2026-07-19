create or replace function public.api_update_focus_session(
  p_session_id uuid,
  p_task_titles text[],
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
declare updated_session public.focus_sessions%rowtype;
begin
  if p_rating is not null and p_rating not between 1 and 5 then
    raise exception 'Invalid focus rating' using errcode = '22023';
  end if;

  update public.focus_sessions set
    task_titles = coalesce(p_task_titles, '{}'),
    outcome = nullif(trim(p_outcome), ''),
    pending = nullif(trim(p_pending), ''),
    next_step = nullif(trim(p_next_step), ''),
    rating = p_rating,
    updated_at = now()
  where id = p_session_id and user_id = auth.uid()
  returning * into updated_session;

  if updated_session.id is null then
    raise exception 'Focus session not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(updated_session) - 'user_id';
end;
$$;

create or replace function public.api_delete_focus_session(p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare deleted_count integer;
begin
  delete from public.focus_sessions where id = p_session_id and user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Focus session not found or access denied' using errcode = '42501';
  end if;
  return true;
end;
$$;

create or replace function public.api_list_my_focus_sessions(p_limit integer)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(to_jsonb(session_result) order by session_result.completed_at desc), '[]'::jsonb)
  from (
    select session_row.id, session_row.project_id, project_row.name as project_name,
      session_row.task_titles, session_row.planned_seconds, session_row.focused_seconds,
      session_row.started_at, session_row.completed_at, session_row.completion_reason,
      session_row.outcome, session_row.pending, session_row.next_step, session_row.rating,
      session_row.created_at, session_row.updated_at
    from public.focus_sessions session_row
    join public.projects project_row on project_row.id = session_row.project_id
    where session_row.user_id = auth.uid()
    order by session_row.completed_at desc
    limit least(greatest(coalesce(p_limit, 30), 1), 100)
  ) session_result;
$$;

revoke all on function public.api_update_focus_session(uuid,text[],text,text,text,smallint) from public, anon;
revoke all on function public.api_delete_focus_session(uuid) from public, anon;
revoke all on function public.api_list_my_focus_sessions(integer) from public, anon;
grant execute on function public.api_update_focus_session(uuid,text[],text,text,text,smallint) to authenticated;
grant execute on function public.api_delete_focus_session(uuid) to authenticated;
grant execute on function public.api_list_my_focus_sessions(integer) to authenticated;

