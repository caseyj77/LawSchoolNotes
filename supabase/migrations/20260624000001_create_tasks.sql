create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text not null default '',
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  position integer not null default 0,
  start_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on tasks(user_id);

alter table tasks enable row level security;

create policy "tasks_all_own" on tasks
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
