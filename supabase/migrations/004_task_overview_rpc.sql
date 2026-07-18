create or replace function public.api_list_my_tasks()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(task_row) || jsonb_build_object(
        'project_name', project_row.name,
        'project_status', project_row.status
      )
      order by
        case when task_row.status = 'done' then 1 else 0 end,
        task_row.due_date asc nulls last,
        task_row.updated_at desc
    ),
    '[]'::jsonb
  )
  from public.tasks as task_row
  join public.projects as project_row on project_row.id = task_row.project_id
  where project_row.user_id = auth.uid();
$$;

revoke all on function public.api_list_my_tasks() from public, anon;
grant execute on function public.api_list_my_tasks() to authenticated;
