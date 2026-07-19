create or replace function public.api_delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from auth.users where id = current_user_id;

  if not found then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke all on function public.api_delete_my_account() from public;
grant execute on function public.api_delete_my_account() to authenticated;
