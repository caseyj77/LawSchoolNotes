create table templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  user_id uuid not null,
  label text not null,
  key text not null,
  placeholder text not null default '',
  position integer not null,
  created_at timestamptz not null default now(),
  unique (template_id, key)
);

create index template_sections_template_id_idx on template_sections(template_id);
