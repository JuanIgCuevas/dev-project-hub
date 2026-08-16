-- Public, shareable project pages. Only this RPC can expose project data to anon.

alter table public.projects
  add column if not exists is_public boolean not null default false,
  add column if not exists public_slug text,
  add column if not exists published_at timestamptz;

create unique index if not exists projects_public_slug_unique_idx
  on public.projects (public_slug)
  where public_slug is not null;

alter table public.projects
  drop constraint if exists projects_public_slug_format_check;

alter table public.projects
  add constraint projects_public_slug_format_check
  check (
    public_slug is null
    or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       and char_length(public_slug) between 3 and 80
  );

create or replace function public.api_update_project_publication(
  p_project_id uuid,
  p_is_public boolean,
  p_slug text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  project_row public.projects%rowtype;
  requested_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into project_row
  from public.projects
  where id = p_project_id and user_id = auth.uid();

  if project_row.id is null then
    raise exception 'Project not found or access denied' using errcode = '42501';
  end if;

  if p_is_public then
    requested_slug := nullif(lower(trim(p_slug)), '');

    if requested_slug is null then
      requested_slug := trim(both '-' from regexp_replace(lower(project_row.name), '[^a-z0-9]+', '-', 'g'));
      requested_slug := left(coalesce(nullif(requested_slug, ''), 'proyecto'), 67)
        || '-' || left(replace(project_row.id::text, '-', ''), 8);
    end if;

    if requested_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
       or char_length(requested_slug) not between 3 and 80 then
      raise exception 'Public slug must contain 3 to 80 lowercase letters, numbers or hyphens' using errcode = '22023';
    end if;

    if exists (
      select 1 from public.projects
      where public_slug = requested_slug and id <> p_project_id
    ) then
      raise exception 'Public slug is already in use' using errcode = '23505';
    end if;
  else
    requested_slug := project_row.public_slug;
  end if;

  update public.projects
  set is_public = p_is_public,
      public_slug = requested_slug,
      published_at = case
        when p_is_public then coalesce(published_at, now())
        else null
      end,
      updated_at = now()
  where id = p_project_id and user_id = auth.uid()
  returning * into project_row;

  return to_jsonb(project_row);
end;
$$;

create or replace function public.api_get_public_project(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'id', project_row.id,
    'name', project_row.name,
    'description', project_row.description,
    'status', project_row.status,
    'technologies', project_row.technologies,
    'repository_url', project_row.repository_url,
    'live_url', project_row.live_url,
    'public_slug', project_row.public_slug,
    'created_at', project_row.created_at,
    'updated_at', project_row.updated_at,
    'published_at', project_row.published_at,
    'owner_name', coalesce(nullif(trim(profile_row.username), ''), 'Developer'),
    'total_tasks', (select count(*) from public.tasks where project_id = project_row.id),
    'completed_tasks', (select count(*) from public.tasks where project_id = project_row.id and status = 'done'),
    'milestones', coalesce(
      (
        select jsonb_agg(jsonb_build_object('id', completed_task.id, 'title', completed_task.title))
        from (
          select task_row.id, task_row.title
          from public.tasks as task_row
          where task_row.project_id = project_row.id and task_row.status = 'done'
          order by task_row.updated_at desc
          limit 6
        ) as completed_task
      ),
      '[]'::jsonb
    )
  )
  from public.projects as project_row
  left join public.profiles as profile_row on profile_row.id = project_row.user_id
  where project_row.is_public = true
    and project_row.public_slug = lower(trim(p_slug));
$$;

revoke all on function public.api_update_project_publication(uuid, boolean, text) from public, anon;
grant execute on function public.api_update_project_publication(uuid, boolean, text) to authenticated;

revoke all on function public.api_get_public_project(text) from public;
grant usage on schema public to anon;
grant execute on function public.api_get_public_project(text) to anon, authenticated;
