alter table public.ideas
  add column converted_project_id uuid references public.projects(id) on delete set null;

create index ideas_converted_project_id_idx on public.ideas(converted_project_id)
  where converted_project_id is not null;

create or replace function public.api_convert_idea_to_project(p_idea_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  source_idea public.ideas%rowtype;
  created_project public.projects%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select * into source_idea
  from public.ideas
  where id = p_idea_id and user_id = auth.uid()
  for update;

  if source_idea.id is null then
    raise exception 'Idea not found or access denied' using errcode = '42501';
  end if;

  if source_idea.converted_project_id is not null then
    select * into created_project
    from public.projects
    where id = source_idea.converted_project_id and user_id = auth.uid();

    if created_project.id is not null then
      return to_jsonb(created_project);
    end if;
  end if;

  insert into public.projects (user_id, name, description, status, technologies)
  values (
    auth.uid(),
    source_idea.title,
    source_idea.description,
    'idea'::public.project_status,
    source_idea.technologies
  )
  returning * into created_project;

  update public.ideas
  set converted_project_id = created_project.id,
      status = 'archived'::public.idea_status,
      updated_at = now()
  where id = source_idea.id;

  return to_jsonb(created_project);
end;
$$;

revoke all on function public.api_convert_idea_to_project(uuid) from public, anon;
grant execute on function public.api_convert_idea_to_project(uuid) to authenticated;
