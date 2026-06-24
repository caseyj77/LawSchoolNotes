-- Zotero-style annotation layer over the document reader (Phase 0: schema only).
-- Anchoring differs by source: PDF stores normalized rects per page; HTML/Word
-- stores W3C text-quote + position selectors. source_type maps onto the existing
-- documents.file_type enum ('pdf' | 'docx'): docx renders to HTML via mammoth,
-- so file_type 'docx' -> source_type 'html'.
create table annotations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  document_id uuid not null references documents(id) on delete cascade,
  source_type text not null check (source_type in ('pdf', 'html')),
  kind        text not null check (kind in ('highlight', 'note', 'underline')) default 'highlight',
  color       text not null default 'yellow'
                check (color in ('yellow', 'green', 'blue', 'pink', 'orange', 'purple')),
  page_index  int,            -- PDF only; null for html
  anchor      jsonb not null, -- shape depends on source_type (see docs/annotations-spec.md)
  quote       text not null,  -- selected text; re-anchor fallback + sidebar label
  comment     jsonb,          -- Tiptap JSON for notes; null for a plain highlight
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index annotations_document_id_idx on annotations(document_id);

alter table annotations enable row level security;

create policy "annotations_all_own" on annotations
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
