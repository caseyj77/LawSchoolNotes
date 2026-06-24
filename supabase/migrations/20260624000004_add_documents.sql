create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id text not null references classes(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  file_type text not null check (file_type in ('pdf', 'docx')),
  created_at timestamptz not null default now()
);

create index documents_course_id_idx on documents(course_id);

alter table documents enable row level security;

create policy "documents_all_own" on documents
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
  values ('documents', 'documents', false)
  on conflict (id) do nothing;

create policy "documents_storage_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documents_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "documents_storage_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
