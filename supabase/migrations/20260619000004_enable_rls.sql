-- No real auth exists yet, so these policies check the stub user id as a
-- literal constant rather than auth.uid(). This is the honest model for
-- "no auth, but RLS shaped correctly": anyone holding the anon key can
-- access the stub user's rows today. TODO(auth): once Supabase Auth ships,
-- replace the literal below with auth.uid() in each policy.

alter table templates enable row level security;
alter table template_sections enable row level security;
alter table case_briefs enable row level security;
alter table brief_sections enable row level security;

create policy "templates_all_own" on templates
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "template_sections_all_own" on template_sections
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "case_briefs_all_own" on case_briefs
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "brief_sections_all_own" on brief_sections
  for all
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (user_id = '00000000-0000-0000-0000-000000000001'::uuid);
