alter table public.profiles add column if not exists email text;

update public.profiles as profiles
set email = users.email
from auth.users as users
where profiles.id = users.id and profiles.email is null;

create unique index if not exists profiles_email_unique_idx
on public.profiles (lower(email)) where email is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set
    username = excluded.username,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set email = new.email, updated_at = now()
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute procedure public.sync_user_email();
