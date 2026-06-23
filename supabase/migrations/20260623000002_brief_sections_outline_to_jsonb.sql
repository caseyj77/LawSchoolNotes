-- Rich text now stores Tiptap JSON instead of HTML strings. Existing HTML
-- values can't be cast to jsonb, and this is discardable dev data, so drop
-- and recreate the columns rather than attempting a lossy conversion.

alter table brief_sections drop column content;
alter table brief_sections add column content jsonb not null default '{"type":"doc","content":[]}'::jsonb;

alter table classes drop column outline;
alter table classes add column outline jsonb not null default '{"type":"doc","content":[]}'::jsonb;
