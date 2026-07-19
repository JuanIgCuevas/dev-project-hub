alter table public.ideas
  add column excitement smallint not null default 3 check (excitement between 1 and 5),
  add column usefulness smallint not null default 3 check (usefulness between 1 and 5),
  add column difficulty smallint not null default 3 check (difficulty between 1 and 5),
  add column portfolio_value smallint not null default 3 check (portfolio_value between 1 and 5),
  add column estimated_hours integer not null default 8 check (estimated_hours between 1 and 1000);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('project_created', 'status_changed', 'task_created', 'task_completed', 'note')),
  title text not null check (char_length(trim(title)) between 1 and 240),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.project_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  context text,
  decision text not null check (char_length(trim(decision)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.project_ship_checklists (
  project_id uuid primary key references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  checks jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index project_events_project_created_idx on public.project_events(project_id, created_at desc);
create index project_decisions_project_created_idx on public.project_decisions(project_id, created_at desc);

alter table public.project_events enable row level security;
alter table public.project_decisions enable row level security;
alter table public.project_ship_checklists enable row level security;

create policy "Project events belong to their owner" on public.project_events for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Project decisions belong to their owner" on public.project_decisions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Project checklists belong to their owner" on public.project_ship_checklists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.log_project_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
begin
  if tg_table_name = 'projects' then
    owner_id := new.user_id;
    if tg_op = 'INSERT' then
      insert into public.project_events(project_id, user_id, event_type, title)
      values (new.id, owner_id, 'project_created', 'Proyecto creado');
    elsif old.status is distinct from new.status then
      insert into public.project_events(project_id, user_id, event_type, title, metadata)
      values (new.id, owner_id, 'status_changed', 'Estado del proyecto actualizado', jsonb_build_object('from', old.status, 'to', new.status));
    end if;
  elsif tg_table_name = 'tasks' then
    select user_id into owner_id from public.projects where id = new.project_id;
    if tg_op = 'INSERT' then
      insert into public.project_events(project_id, user_id, event_type, title, metadata)
      values (new.project_id, owner_id, 'task_created', 'Nueva tarea: ' || new.title, jsonb_build_object('task_id', new.id));
    elsif old.status is distinct from new.status and new.status = 'done' then
      insert into public.project_events(project_id, user_id, event_type, title, metadata)
      values (new.project_id, owner_id, 'task_completed', 'Tarea completada: ' || new.title, jsonb_build_object('task_id', new.id));
    end if;
  end if;
  return new;
end;
$$;

create trigger project_activity_trigger after insert or update of status on public.projects
for each row execute function public.log_project_activity();
create trigger task_activity_trigger after insert or update of status on public.tasks
for each row execute function public.log_project_activity();

create or replace function public.api_create_idea(
  p_title text, p_description text, p_technologies text[], p_status public.idea_status,
  p_excitement smallint, p_usefulness smallint, p_difficulty smallint,
  p_portfolio_value smallint, p_estimated_hours integer
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare created_idea public.ideas%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.ideas(user_id, title, description, technologies, status, excitement, usefulness, difficulty, portfolio_value, estimated_hours)
  values(auth.uid(), trim(p_title), nullif(trim(p_description), ''), coalesce(p_technologies, '{}'), p_status, p_excitement, p_usefulness, p_difficulty, p_portfolio_value, p_estimated_hours)
  returning * into created_idea;
  return to_jsonb(created_idea);
end;
$$;

create or replace function public.api_update_idea(
  p_idea_id uuid, p_title text, p_description text, p_technologies text[], p_status public.idea_status,
  p_excitement smallint, p_usefulness smallint, p_difficulty smallint,
  p_portfolio_value smallint, p_estimated_hours integer
)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare updated_idea public.ideas%rowtype;
begin
  update public.ideas set title=trim(p_title), description=nullif(trim(p_description), ''), technologies=coalesce(p_technologies, '{}'), status=p_status,
    excitement=p_excitement, usefulness=p_usefulness, difficulty=p_difficulty, portfolio_value=p_portfolio_value, estimated_hours=p_estimated_hours, updated_at=now()
  where id=p_idea_id and user_id=auth.uid() returning * into updated_idea;
  if updated_idea.id is null then raise exception 'Idea not found or access denied' using errcode='42501'; end if;
  return to_jsonb(updated_idea);
end;
$$;

create or replace function public.api_list_project_insights(p_project_id uuid)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
    'events', coalesce((select jsonb_agg(to_jsonb(event_row) order by event_row.created_at desc) from public.project_events event_row where event_row.project_id=p_project_id), '[]'::jsonb),
    'decisions', coalesce((select jsonb_agg(to_jsonb(decision_row) order by decision_row.created_at desc) from public.project_decisions decision_row where decision_row.project_id=p_project_id), '[]'::jsonb),
    'checklist', coalesce((select checklist_row.checks from public.project_ship_checklists checklist_row where checklist_row.project_id=p_project_id), '{}'::jsonb)
  )
  where exists(select 1 from public.projects where id=p_project_id and user_id=auth.uid());
$$;

create or replace function public.api_add_project_note(p_project_id uuid, p_title text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare created_event public.project_events%rowtype;
begin
  if not exists(select 1 from public.projects where id=p_project_id and user_id=auth.uid()) then raise exception 'Project not found or access denied' using errcode='42501'; end if;
  insert into public.project_events(project_id,user_id,event_type,title) values(p_project_id,auth.uid(),'note',trim(p_title)) returning * into created_event;
  return to_jsonb(created_event);
end;
$$;

create or replace function public.api_create_project_decision(p_project_id uuid, p_title text, p_context text, p_decision text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare created_decision public.project_decisions%rowtype;
begin
  if not exists(select 1 from public.projects where id=p_project_id and user_id=auth.uid()) then raise exception 'Project not found or access denied' using errcode='42501'; end if;
  insert into public.project_decisions(project_id,user_id,title,context,decision)
  values(p_project_id,auth.uid(),trim(p_title),nullif(trim(p_context),''),trim(p_decision)) returning * into created_decision;
  return to_jsonb(created_decision);
end;
$$;

create or replace function public.api_delete_project_decision(p_decision_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare deleted_count integer;
begin
  delete from public.project_decisions where id=p_decision_id and user_id=auth.uid();
  get diagnostics deleted_count=row_count;
  if deleted_count=0 then raise exception 'Decision not found or access denied' using errcode='42501'; end if;
  return true;
end;
$$;

create or replace function public.api_update_ship_checklist(p_project_id uuid, p_checks jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare updated_checks jsonb;
begin
  if not exists(select 1 from public.projects where id=p_project_id and user_id=auth.uid()) then raise exception 'Project not found or access denied' using errcode='42501'; end if;
  insert into public.project_ship_checklists(project_id,user_id,checks) values(p_project_id,auth.uid(),coalesce(p_checks,'{}'))
  on conflict(project_id) do update set checks=excluded.checks,updated_at=now() returning checks into updated_checks;
  return updated_checks;
end;
$$;

revoke all on public.project_events, public.project_decisions, public.project_ship_checklists from public, anon, authenticated;
revoke execute on function public.api_create_idea(text,text,text[],public.idea_status) from authenticated;
revoke execute on function public.api_update_idea(uuid,text,text,text[],public.idea_status) from authenticated;
revoke all on function public.api_create_idea(text,text,text[],public.idea_status,smallint,smallint,smallint,smallint,integer) from public,anon;
revoke all on function public.api_update_idea(uuid,text,text,text[],public.idea_status,smallint,smallint,smallint,smallint,integer) from public,anon;
revoke all on function public.api_list_project_insights(uuid) from public,anon;
revoke all on function public.api_add_project_note(uuid,text) from public,anon;
revoke all on function public.api_create_project_decision(uuid,text,text,text) from public,anon;
revoke all on function public.api_delete_project_decision(uuid) from public,anon;
revoke all on function public.api_update_ship_checklist(uuid,jsonb) from public,anon;
grant execute on function public.api_create_idea(text,text,text[],public.idea_status,smallint,smallint,smallint,smallint,integer) to authenticated;
grant execute on function public.api_update_idea(uuid,text,text,text[],public.idea_status,smallint,smallint,smallint,smallint,integer) to authenticated;
grant execute on function public.api_list_project_insights(uuid) to authenticated;
grant execute on function public.api_add_project_note(uuid,text) to authenticated;
grant execute on function public.api_create_project_decision(uuid,text,text,text) to authenticated;
grant execute on function public.api_delete_project_decision(uuid) to authenticated;
grant execute on function public.api_update_ship_checklist(uuid,jsonb) to authenticated;
