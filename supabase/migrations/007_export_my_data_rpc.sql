create or replace function public.api_export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (
      select to_jsonb(profile_row)
      from public.profiles as profile_row
      where profile_row.id = auth.uid()
    ),
    'projects', coalesce((
      select jsonb_agg(
        to_jsonb(project_row) || jsonb_build_object(
          'tasks', coalesce((
            select jsonb_agg(to_jsonb(task_row) order by task_row.created_at)
            from public.tasks as task_row
            where task_row.project_id = project_row.id
          ), '[]'::jsonb)
        )
        order by project_row.created_at
      )
      from public.projects as project_row
      where project_row.user_id = auth.uid()
    ), '[]'::jsonb),
    'ideas', coalesce((
      select jsonb_agg(to_jsonb(idea_row) order by idea_row.created_at)
      from public.ideas as idea_row
      where idea_row.user_id = auth.uid()
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.api_export_my_data() from public, anon;
grant execute on function public.api_export_my_data() to authenticated;
