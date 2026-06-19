create table case_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_id uuid not null references templates(id),
  class_id text not null,
  case_name text not null default '',
  citation text not null default '',
  student_notes text not null default '',
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_briefs_user_id_idx on case_briefs(user_id);
create index case_briefs_class_id_idx on case_briefs(class_id);

create table brief_sections (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references case_briefs(id) on delete cascade,
  template_section_id uuid not null references template_sections(id),
  user_id uuid not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (brief_id, template_section_id)
);

create index brief_sections_brief_id_idx on brief_sections(brief_id);
