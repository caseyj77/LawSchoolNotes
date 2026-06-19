create table classes (
  id text primary key,
  user_id uuid not null,
  title text not null,
  focus text not null default '',
  outline text not null default '',
  last_active_brief_id uuid references case_briefs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_user_id_idx on classes(user_id);
create index classes_last_active_brief_id_idx on classes(last_active_brief_id);

alter table case_briefs
  add constraint case_briefs_class_id_fkey
  foreign key (class_id) references classes(id) on delete cascade;

alter table classes enable row level security;

create policy "classes_all_own" on classes
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
