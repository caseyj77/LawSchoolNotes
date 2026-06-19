import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

const defaultTemplateSections = [
  { id: 'sec-facts', template_id: DEFAULT_TEMPLATE_ID, key: 'facts', label: 'Facts', placeholder: '', position: 1 },
  { id: 'sec-issue', template_id: DEFAULT_TEMPLATE_ID, key: 'issue', label: 'Issue', placeholder: '', position: 2 },
  { id: 'sec-rule', template_id: DEFAULT_TEMPLATE_ID, key: 'rule', label: 'Rule', placeholder: '', position: 3 },
  { id: 'sec-analysis', template_id: DEFAULT_TEMPLATE_ID, key: 'analysis', label: 'Analysis', placeholder: '', position: 4 },
  { id: 'sec-conclusion', template_id: DEFAULT_TEMPLATE_ID, key: 'conclusion', label: 'Conclusion', placeholder: '', position: 5 },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadNotesStore() {
  const { useNotesStore } = await import('../notesStore')
  return useNotesStore()
}

describe('useNotesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    supabaseMock = createSupabaseMock({ template_sections: defaultTemplateSections })
  })

  it('createAndSaveBrief generates an id, sets classId, and starts with blank sections', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ classId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(brief.id).toBeTruthy()
    expect(brief.classId).toBe('contracts')
    expect(brief.caseName).toBe('Hadley v. Baxendale')
    expect(brief.sections.facts).toBe('')
    expect(store.getBriefById(brief.id).caseName).toBe('Hadley v. Baxendale')
  })

  it('createAndSaveBrief marks the new brief as the active brief for its class', async () => {
    const { useActiveBriefStore } = await import('../activeBriefStore')
    const store = await loadNotesStore()
    const activeBriefStore = useActiveBriefStore()
    const brief = await store.createAndSaveBrief({ classId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(brief.id)
  })

  it('saveCaseBrief updates the active brief store for both new and existing briefs', async () => {
    const { useActiveBriefStore } = await import('../activeBriefStore')
    const store = await loadNotesStore()
    const activeBriefStore = useActiveBriefStore()

    const brief = await store.createBlankBrief('contracts')
    brief.caseName = 'Palsgraf'
    const saved = await store.saveCaseBrief(brief)

    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(saved.id)

    saved.caseName = 'Palsgraf v. Long Island Railroad Co.'
    await store.saveCaseBrief(saved)

    expect(store.getBriefById(saved.id).caseName).toBe('Palsgraf v. Long Island Railroad Co.')
    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(saved.id)
  })

  it('saveCaseBrief persists section content keyed by template section', async () => {
    const store = await loadNotesStore()
    const brief = await store.createBlankBrief('contracts')
    brief.caseName = 'Hadley'
    brief.sections.facts = '<p>The mill shaft broke.</p>'

    const saved = await store.saveCaseBrief(brief)

    expect(supabaseMock.db.brief_sections.find((row) => row.brief_id === saved.id && row.template_section_id === 'sec-facts').content).toBe(
      '<p>The mill shaft broke.</p>',
    )
  })

  it('seed classes start with an empty outline', async () => {
    const store = await loadNotesStore()
    expect(store.getClassById('contracts').outline).toBe('')
  })

  it('updateOutline sets the outline HTML for an existing class', async () => {
    const store = await loadNotesStore()
    store.updateOutline('contracts', '<p>Formation requires offer, acceptance, consideration.</p>')

    expect(store.getClassById('contracts').outline).toBe(
      '<p>Formation requires offer, acceptance, consideration.</p>',
    )
  })

  it('updateOutline does nothing for an unknown class id', async () => {
    const store = await loadNotesStore()
    expect(() => store.updateOutline('does-not-exist', '<p>x</p>')).not.toThrow()
  })

  it('a new class created via addClass starts with an empty outline', async () => {
    const store = await loadNotesStore()
    const created = store.addClass({ title: 'Evidence', focus: 'Relevance and hearsay.' })

    expect(created.outline).toBe('')
  })
})
