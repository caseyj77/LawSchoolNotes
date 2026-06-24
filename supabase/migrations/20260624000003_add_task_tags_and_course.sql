alter table tasks add column tags text[] not null default '{}'::text[];
alter table tasks add column course_id text references classes(id) on delete set null;

create index tasks_course_id_idx on tasks(course_id);
