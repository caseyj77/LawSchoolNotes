-- Real Supabase Auth is now wired up. Replace the stub-id RLS policies with
-- auth.uid() so each row is scoped to the actual signed-in user.

drop policy "templates_all_own" on templates;
create policy "templates_all_own" on templates
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy "template_sections_all_own" on template_sections;
create policy "template_sections_all_own" on template_sections
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy "case_briefs_all_own" on case_briefs;
create policy "case_briefs_all_own" on case_briefs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy "brief_sections_all_own" on brief_sections;
create policy "brief_sections_all_own" on brief_sections
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy "classes_all_own" on classes;
create policy "classes_all_own" on classes
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
