// Matches the id seeded in supabase/migrations/20260619000003_seed_default_template.sql.
// Kept for the (now legacy) stub-user seed; real per-user templates are
// provisioned at runtime by the notes store, so this id is no longer the
// source of truth for an authenticated user's sections.
export const DEFAULT_TEMPLATE_ID = '11111111-1111-1111-1111-111111111111'

export const DEFAULT_TEMPLATE_NAME = 'Law School Case Brief'

// The canonical case-brief sections, in display order. This is the single
// source of truth: the notes store provisions these into the signed-in user's
// own template (template_sections rows) the first time they open a brief, and
// reconciles any missing sections for users who were seeded an earlier set.
// `position` leaves no gaps so the order is unambiguous.
export const DEFAULT_BRIEF_SECTIONS = [
  { key: 'issue', label: 'Issue', placeholder: 'Frame the question the court answered.', position: 1 },
  {
    key: 'procedural_history',
    label: 'Procedural History',
    placeholder: 'Trace how the case moved through the lower courts to reach this one.',
    position: 2,
  },
  { key: 'facts', label: 'Facts', placeholder: 'Summarize the legally significant facts.', position: 3 },
  { key: 'rule', label: 'Rule', placeholder: 'State the governing rule or legal standard.', position: 4 },
  { key: 'holding', label: 'Holding', placeholder: "State the court's direct answer to the issue.", position: 5 },
  {
    key: 'analysis',
    label: 'Analysis / Reasoning',
    placeholder: 'Capture how the court applied the rule.',
    position: 6,
  },
  {
    key: 'conclusion',
    label: 'Conclusion / Disposition',
    placeholder: 'Note the disposition (affirmed, reversed, remanded) and the bottom-line takeaway.',
    position: 7,
  },
  {
    key: 'concurrence_dissent',
    label: 'Concurrence / Dissent',
    placeholder: 'Summarize any separate opinions and why they differ.',
    position: 8,
  },
  {
    key: 'policy_notes',
    label: 'Policy / Notes',
    placeholder: 'Capture policy rationale, synthesis, or notes for class and exams.',
    position: 9,
  },
]
