import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

const templateSections = [
  { id: 'sec-facts', template_id: DEFAULT_TEMPLATE_ID, key: 'facts', label: 'Facts', position: 1 },
  { id: 'sec-issue', template_id: DEFAULT_TEMPLATE_ID, key: 'issue', label: 'Issue', position: 2 },
  { id: 'sec-rule', template_id: DEFAULT_TEMPLATE_ID, key: 'rule', label: 'Rule', position: 3 },
  { id: 'sec-analysis', template_id: DEFAULT_TEMPLATE_ID, key: 'analysis', label: 'Analysis', position: 4 },
  { id: 'sec-conclusion', template_id: DEFAULT_TEMPLATE_ID, key: 'conclusion', label: 'Conclusion', position: 5 },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadMigrate() {
  const { migrateLocalBriefsToSupabase } = await import('../migrateLocalBriefs')
  return migrateLocalBriefsToSupabase
}

describe('migrateLocalBriefsToSupabase', () => {
  beforeEach(() => {
    localStorage.clear()
    supabaseMock = createSupabaseMock()
  })

  it('is a no-op when there is no legacy data', async () => {
    const migrate = await loadMigrate()
    const result = await migrate(templateSections)

    expect(result).toEqual({ migrated: 0 })
    expect(supabaseMock.db.case_briefs ?? []).toHaveLength(0)
  })

  it('moves legacy facts/issue/rule/analysis/conclusion content into brief_sections, keyed by template section', async () => {
    localStorage.setItem(
      'law-school-notes',
      JSON.stringify([
        {
          id: 'legacy-1',
          classId: 'contracts',
          caseName: 'Hadley v. Baxendale',
          citation: '9 Ex. 341 (1854)',
          facts: '<p>The mill shaft broke.</p>',
          issue: '<p>Were the damages foreseeable?</p>',
          rule: '',
          analysis: '',
          conclusion: '<p>No, damages were not recoverable.</p>',
          studentNotes: 'Foreseeability limits consequential damages.',
        },
      ]),
    )

    const migrate = await loadMigrate()
    const result = await migrate(templateSections)

    expect(result).toEqual({ migrated: 1 })

    const briefRow = supabaseMock.db.case_briefs[0]
    expect(briefRow.case_name).toBe('Hadley v. Baxendale')
    expect(briefRow.class_id).toBe('contracts')

    const factsSection = supabaseMock.db.brief_sections.find(
      (row) => row.brief_id === briefRow.id && row.template_section_id === 'sec-facts',
    )
    expect(factsSection.content).toBe('<p>The mill shaft broke.</p>')

    const conclusionSection = supabaseMock.db.brief_sections.find(
      (row) => row.brief_id === briefRow.id && row.template_section_id === 'sec-conclusion',
    )
    expect(conclusionSection.content).toBe('<p>No, damages were not recoverable.</p>')
  })

  it('does not re-run once the migration flag is set', async () => {
    localStorage.setItem(
      'law-school-notes',
      JSON.stringify([{ id: 'legacy-1', classId: 'contracts', caseName: 'Hadley', facts: '<p>x</p>' }]),
    )

    const migrate = await loadMigrate()
    await migrate(templateSections)
    const secondRun = await migrate(templateSections)

    expect(secondRun).toEqual({ migrated: 0 })
    expect(supabaseMock.db.case_briefs).toHaveLength(1)
  })
})
