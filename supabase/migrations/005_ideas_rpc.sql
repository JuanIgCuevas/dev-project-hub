create type public.idea_status as enum ('inbox', 'considering', 'archived');

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text,
  technologies text[] not null default '{}',
  status public.idea_status not null default 'inbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ideas_user_id_updated_at_idx on public.ideas(user_id, updated_at desc);

alter table public.ideas enable row level security;

create policy "Ideas are visible to their owner" on public.ideas
  for select using (auth.uid() = user_id);
create policy "Ideas can be inserted by their owner" on public.ideas
  for insert with check (auth.uid() = user_id);
create policy "Ideas can be updated by their owner" on public.ideas
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Ideas can be deleted by their owner" on public.ideas
  for delete using (auth.uid() = user_id);

create or replace function public.api_list_ideas()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(to_jsonb(idea_row) order by
      case idea_row.status when 'inbox' then 0 when 'considering' then 1 else 2 end,
      idea_row.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.ideas as idea_row
  where idea_row.user_id = auth.uid();
$$;

create or replace function public.api_create_idea(
  p_title text,
  p_description text,
  p_technologies text[],
  p_status public.idea_status
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  created_idea public.ideas%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.ideas (user_id, title, description, technologies, status)
  values (auth.uid(), trim(p_title), nullif(trim(p_description), ''), coalesce(p_technologies, '{}'), p_status)
  returning * into created_idea;

  return to_jsonb(created_idea);
end;
$$;

create or replace function public.api_update_idea(
  p_idea_id uuid,
  p_title text,
  p_description text,
  p_technologies text[],
  p_status public.idea_status
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_idea public.ideas%rowtype;
begin
  update public.ideas
  set title = trim(p_title),
      description = nullif(trim(p_description), ''),
      technologies = coalesce(p_technologies, '{}'),
      status = p_status,
      updated_at = now()
  where id = p_idea_id and user_id = auth.uid()
  returning * into updated_idea;

  if updated_idea.id is null then
    raise exception 'Idea not found or access denied' using errcode = '42501';
  end if;
  return to_jsonb(updated_idea);
end;
$$;

create or replace function public.api_delete_idea(p_idea_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count integer;
begin
  delete from public.ideas where id = p_idea_id and user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  if deleted_count = 0 then
    raise exception 'Idea not found or access denied' using errcode = '42501';
  end if;
  return true;
end;
$$;

revoke all on public.ideas from public, anon, authenticated;
revoke all on function public.api_list_ideas() from public, anon;
revoke all on function public.api_create_idea(text, text, text[], public.idea_status) from public, anon;
revoke all on function public.api_update_idea(uuid, text, text, text[], public.idea_status) from public, anon;
revoke all on function public.api_delete_idea(uuid) from public, anon;

grant execute on function public.api_list_ideas() to authenticated;
grant execute on function public.api_create_idea(text, text, text[], public.idea_status) to authenticated;
grant execute on function public.api_update_idea(uuid, text, text, text[], public.idea_status) to authenticated;
grant execute on function public.api_delete_idea(uuid) to authenticated;
