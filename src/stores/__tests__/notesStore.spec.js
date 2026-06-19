import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentUserId } from '@/lib/currentUser'
import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

const defaultTemplateSections = [
  { id: 'sec-facts', template_id: DEFAULT_TEMPLATE_ID, key: 'facts', label: 'Facts', placeholder: '', position: 1 },
  { id: 'sec-issue', template_id: DEFAULT_TEMPLATE_ID, key: 'issue', label: 'Issue', placeholder: '', position: 2 },
  { id: 'sec-rule', template_id: DEFAULT_TEMPLATE_ID, key: 'rule', label: 'Rule', placeholder: '', position: 3 },
  { id: 'sec-analysis', template_id: DEFAULT_TEMPLATE_ID, key: 'analysis', label: 'Analysis', placeholder: '', position: 4 },
  { id: 'sec-conclusion', template_id: DEFAULT_TEMPLATE_ID, key: 'conclusion', label: 'Conclusion', placeholder: '', position: 5 },
]

const defaultClasses = [
  { id: 'contracts', user_id: getCurrentUserId(), title: 'Contracts', focus: '', outline: '', last_active_brief_id: null },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadNotesStore() {
  const { useNotesStore } = await import('../notesStore')
  const store = useNotesStore()
  await store.fetchClasses()
  return store
}

describe('useNotesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    supabaseMock = createSupabaseMock({ template_sections: defaultTemplateSections, classes: defaultClasses })
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
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ classId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(store.getActiveBriefForClass('contracts')).toBe(brief.id)
  })

  it('saveCaseBrief updates the active brief for both new and existing briefs', async () => {
    const store = await loadNotesStore()

    const brief = await store.createBlankBrief('contracts')
    brief.caseName = 'Palsgraf'
    const saved = await store.saveCaseBrief(brief)

    expect(store.getActiveBriefForClass('contracts')).toBe(saved.id)

    saved.caseName = 'Palsgraf v. Long Island Railroad Co.'
    await store.saveCaseBrief(saved)

    expect(store.getBriefById(saved.id).caseName).toBe('Palsgraf v. Long Island Railroad Co.')
    expect(store.getActiveBriefForClass('contracts')).toBe(saved.id)
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

  it('updateOutline persists to Supabase after the debounce window, coalescing rapid edits', async () => {
    vi.useFakeTimers()
    try {
      const store = await loadNotesStore()
      store.updateOutline('contracts', '<p>first</p>')
      store.updateOutline('contracts', '<p>second</p>')

      await vi.advanceTimersByTimeAsync(600)

      const row = supabaseMock.db.classes.find((cls) => cls.id === 'contracts')
      expect(row.outline).toBe('<p>second</p>')
    } finally {
      vi.useRealTimers()
    }
  })

  it('a new class created via addClass starts with an empty outline', async () => {
    const store = await loadNotesStore()
    const created = await store.addClass({ title: 'Evidence', focus: 'Relevance and hearsay.' })

    expect(created.outline).toBe('')
    expect(supabaseMock.db.classes.find((cls) => cls.id === created.id)).toBeTruthy()
  })

  it('getActiveBriefForClass returns null when no brief has been set as active', async () => {
    const store = await loadNotesStore()
    expect(store.getActiveBriefForClass('contracts')).toBeNull()
  })

  it('deleteClass removes the class locally and from Supabase', async () => {
    const store = await loadNotesStore()
    expect(store.getClassById('contracts')).toBeTruthy()

    await store.deleteClass('contracts')

    expect(store.getClassById('contracts')).toBeUndefined()
    expect(supabaseMock.db.classes.find((cls) => cls.id === 'contracts')).toBeUndefined()
    // The mock has no FK-cascade simulation, so case_briefs/brief_sections cascade
    // cleanup is only verified against the real database (see manual smoke test).
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
