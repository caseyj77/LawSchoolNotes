-- Seeds exactly one default template, owned by the stub user.
-- NOTE: the stub user id here must match src/lib/currentUser.js exactly,
-- and the template id must match src/lib/templates.js DEFAULT_TEMPLATE_ID.
insert into templates (id, user_id, name)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Law School Case Brief')
on conflict (id) do nothing;

insert into template_sections (template_id, user_id, label, key, placeholder, position)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Facts', 'facts', 'Summarize the legally significant facts.', 1),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Issue', 'issue', 'Frame the question the court answered.', 2),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Rule', 'rule', 'State the governing rule or legal standard.', 3),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Analysis/Reasoning', 'analysis', 'Capture how the court applied the rule.', 4),
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Conclusion/Holding', 'conclusion', 'Note the disposition or takeaway.', 5)
on conflict (template_id, key) do nothing;
