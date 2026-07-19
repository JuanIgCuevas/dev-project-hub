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
    update public.projects set updated_at = now() where id = new.project_id;
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
        order by project_row.created_at
      ) from public.projects project_row where project_row.user_id=auth.uid()
    ), '[]'::jsonb),
    'ideas', coalesce((select jsonb_agg(to_jsonb(idea_row) order by idea_row.created_at) from public.ideas idea_row where idea_row.user_id=auth.uid()), '[]'::jsonb)
  );
$$;
