-- Todas las operaciones de datos de la aplicacion pasan por estas funciones.
-- Auth continua utilizando la API oficial de Supabase Auth.

create or replace function public.api_get_my_profile()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select to_jsonb(profile_row)
  from public.profiles as profile_row
  where profile_row.id = auth.uid();
$$;

create or replace function public.api_update_my_profile(p_username text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(trim(p_username)) < 2 or char_length(trim(p_username)) > 40 then
    raise exception 'Username must contain between 2 and 40 characters' using errcode = '22023';
  end if;

  update public.profiles
  set username = trim(p_username), updated_at = now()
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  return to_jsonb(updated_profile);
end;
$$;

create or replace function public.api_list_projects()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(project_row) || jsonb_build_object(
        'tasks', coalesce(
          (select jsonb_agg(jsonb_build_object('id', task_row.id, 'status', task_row.status))
           from public.tasks as task_row
           where task_row.project_id = project_row.id),
          '[]'::jsonb
        )
      )
      order by project_row.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.projects as project_row
  where project_row.user_id = auth.uid();
$$;

create or replace function public.api_get_project(p_project_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select to_jsonb(project_row) || jsonb_build_object(
    'tasks', coalesce(
      (select jsonb_agg(to_jsonb(task_row) order by task_row.created_at desc)
       from public.tasks as task_row
       where task_row.project_id = project_row.id),
      '[]'::jsonb
    )
  )
  from public.projects as project_row
  where project_row.id = p_project_id
    and project_row.user_id = auth.uid();
$$;

create or replace function public.api_create_project(
  p_name text,
  p_description text,
  p_status public.project_status,
  p_technologies text[],
  p_repository_url text,
  p_live_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_project public.projects%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.projects (user_id, name, description, status, technologies, repository_url, live_url)
  values (auth.uid(), trim(p_name), nullif(trim(p_description), ''), p_status, coalesce(p_technologies, '{}'), nullif(trim(p_repository_url), ''), nullif(trim(p_live_url), ''))
  returning * into created_project;

  return to_jsonb(created_project);
end;
$$;

create or replace function public.api_update_project(
  p_project_id uuid,
  p_name text,
  p_description text,
  p_status public.project_status,
  p_technologies text[],
  p_repository_url text,
  p_live_url text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_project public.projects%rowtype;
begin
  update public.projects
  set name = trim(p_name),
      description = nullif(trim(p_description), ''),
      status = p_status,
      technologies = coalesce(p_technologies, '{}'),
      repository_url = nullif(trim(p_repository_url), ''),
      live_url = nullif(trim(p_live_url), ''),
      updated_at = now()
  where id = p_project_id and user_id = auth.uid()
  returning * into updated_project;

  if updated_project.id is null then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(updated_project);
end;
$$;

create or replace function public.api_delete_project(p_project_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.projects where id = p_project_id and user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;
  return true;
end;
$$;

create or replace function public.api_create_task(
  p_project_id uuid,
  p_title text,
  p_description text,
  p_status public.task_status,
  p_priority public.task_priority,
  p_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_task public.tasks%rowtype;
begin
  if not exists (select 1 from public.projects where id = p_project_id and user_id = auth.uid()) then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;

  insert into public.tasks (project_id, title, description, status, priority, due_date)
  values (p_project_id, trim(p_title), nullif(trim(p_description), ''), p_status, p_priority, p_due_date)
  returning * into created_task;
  return to_jsonb(created_task);
end;
$$;

create or replace function public.api_update_task(
  p_task_id uuid,
  p_title text,
  p_description text,
  p_status public.task_status,
  p_priority public.task_priority,
  p_due_date date
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_task public.tasks%rowtype;
begin
  update public.tasks as task_row
  set title = trim(p_title),
      description = nullif(trim(p_description), ''),
      status = p_status,
      priority = p_priority,
      due_date = p_due_date,
      updated_at = now()
  where task_row.id = p_task_id
    and exists (
      select 1 from public.projects as project_row
      where project_row.id = task_row.project_id and project_row.user_id = auth.uid()
    )
  returning task_row.* into updated_task;

  if updated_task.id is null then
    raise exception 'Task not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(updated_task);
end;
$$;

create or replace function public.api_update_task_status(p_task_id uuid, p_status public.task_status)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_task public.tasks%rowtype;
begin
  update public.tasks as task_row
  set status = p_status, updated_at = now()
  where task_row.id = p_task_id
    and exists (
      select 1 from public.projects as project_row
      where project_row.id = task_row.project_id and project_row.user_id = auth.uid()
    )
  returning task_row.* into updated_task;

  if updated_task.id is null then
    raise exception 'Task not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(updated_task);
end;
$$;

create or replace function public.api_delete_task(p_task_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.tasks as task_row
  where task_row.id = p_task_id
    and exists (
      select 1 from public.projects as project_row
      where project_row.id = task_row.project_id and project_row.user_id = auth.uid()
    );
  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Task not found or access denied' using errcode = '42501';
  end if;
  return true;
end;
$$;

revoke all on public.profiles, public.projects, public.tasks from anon, authenticated;

revoke all on function public.api_get_my_profile() from public, anon;
revoke all on function public.api_update_my_profile(text) from public, anon;
revoke all on function public.api_list_projects() from public, anon;
revoke all on function public.api_get_project(uuid) from public, anon;
revoke all on function public.api_create_project(text, text, public.project_status, text[], text, text) from public, anon;
revoke all on function public.api_update_project(uuid, text, text, public.project_status, text[], text, text) from public, anon;
revoke all on function public.api_delete_project(uuid) from public, anon;
revoke all on function public.api_create_task(uuid, text, text, public.task_status, public.task_priority, date) from public, anon;
revoke all on function public.api_update_task(uuid, text, text, public.task_status, public.task_priority, date) from public, anon;
revoke all on function public.api_update_task_status(uuid, public.task_status) from public, anon;
revoke all on function public.api_delete_task(uuid) from public, anon;

grant execute on function public.api_get_my_profile() to authenticated;
grant execute on function public.api_update_my_profile(text) to authenticated;
grant execute on function public.api_list_projects() to authenticated;
grant execute on function public.api_get_project(uuid) to authenticated;
grant execute on function public.api_create_project(text, text, public.project_status, text[], text, text) to authenticated;
grant execute on function public.api_update_project(uuid, text, text, public.project_status, text[], text, text) to authenticated;
grant execute on function public.api_delete_project(uuid) to authenticated;
grant execute on function public.api_create_task(uuid, text, text, public.task_status, public.task_priority, date) to authenticated;
grant execute on function public.api_update_task(uuid, text, text, public.task_status, public.task_priority, date) to authenticated;
grant execute on function public.api_update_task_status(uuid, public.task_status) to authenticated;
grant execute on function public.api_delete_task(uuid) to authenticated;
