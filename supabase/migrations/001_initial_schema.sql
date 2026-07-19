create extension if not exists "pgcrypto";

create type public.project_status as enum ('idea', 'in_progress', 'paused', 'completed');
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text,
  status public.project_status not null default 'idea',
  technologies text[] not null default '{}',
  repository_url text,
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index tasks_project_id_idx on public.tasks(project_id);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "Profiles are visible to their owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles can be inserted by their owner" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles can be updated by their owner" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Projects are visible to their owner" on public.projects for select using (auth.uid() = user_id);
create policy "Projects can be inserted by their owner" on public.projects for insert with check (auth.uid() = user_id);
create policy "Projects can be updated by their owner" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Projects can be deleted by their owner" on public.projects for delete using (auth.uid() = user_id);

create policy "Tasks are visible through owned projects" on public.tasks for select using (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()));
create policy "Tasks can be inserted into owned projects" on public.tasks for insert with check (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()));
create policy "Tasks can be updated through owned projects" on public.tasks for update using (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid())) with check (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()));
create policy "Tasks can be deleted through owned projects" on public.tasks for delete using (exists (select 1 from public.projects where projects.id = tasks.project_id and projects.user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
