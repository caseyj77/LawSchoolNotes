import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

const TEST_USER_ID = 'test-user-id'
const TEST_TEMPLATE_ID = 'test-template'
const EMPTY_DOC = { type: 'doc', content: [] }

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

// The store provisions a per-user template lazily; seed one already owned by the
// test user (with stable section ids the assertions reference) so getTemplateSections
// resolves it instead of creating a fresh one.
const defaultTemplates = [{ id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, name: 'Law School Case Brief' }]

const defaultTemplateSections = [
  { id: 'sec-facts', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'facts', label: 'Facts', placeholder: '', position: 1 },
  { id: 'sec-procedural', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'procedural_history', label: 'Procedural History', placeholder: '', position: 2 },
  { id: 'sec-issue', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'issue', label: 'Issue', placeholder: '', position: 3 },
  { id: 'sec-rule', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'rule', label: 'Rule', placeholder: '', position: 4 },
  { id: 'sec-holding', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'holding', label: 'Holding', placeholder: '', position: 5 },
  { id: 'sec-analysis', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'analysis', label: 'Analysis / Reasoning', placeholder: '', position: 6 },
  { id: 'sec-conclusion', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'conclusion', label: 'Conclusion / Disposition', placeholder: '', position: 7 },
  { id: 'sec-concurrence', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'concurrence_dissent', label: 'Concurrence / Dissent', placeholder: '', position: 8 },
  { id: 'sec-policy', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'policy_notes', label: 'Policy / Notes', placeholder: '', position: 9 },
]

const defaultCourses = [
  { id: 'contracts', user_id: TEST_USER_ID, title: 'Contracts', focus: '', outline: EMPTY_DOC, last_active_brief_id: null },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadNotesStore() {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()
  authStore.user = { id: TEST_USER_ID }

  const { useNotesStore } = await import('../notesStore')
  const store = useNotesStore()
  await store.fetchCourses()
  return store
}

describe('useNotesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    supabaseMock = createSupabaseMock({
      templates: defaultTemplates,
      template_sections: defaultTemplateSections,
      classes: defaultCourses,
    })
  })

  it('createAndSaveBrief generates an id, sets courseId, and starts with blank sections', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ courseId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(brief.id).toBeTruthy()
    expect(brief.courseId).toBe('contracts')
    expect(brief.caseName).toBe('Hadley v. Baxendale')
    expect(brief.sections.facts).toEqual(EMPTY_DOC)
    expect(store.getBriefById(brief.id).caseName).toBe('Hadley v. Baxendale')
  })

  it('createAndSaveBrief marks the new brief as the active brief for its course', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ courseId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(store.getActiveBriefForCourse('contracts')).toBe(brief.id)
  })

  it('saveCaseBrief updates the active brief for both new and existing briefs', async () => {
    const store = await loadNotesStore()

    const brief = await store.createBlankBrief('contracts')
    brief.caseName = 'Palsgraf'
    const saved = await store.saveCaseBrief(brief)

    expect(store.getActiveBriefForCourse('contracts')).toBe(saved.id)

    saved.caseName = 'Palsgraf v. Long Island Railroad Co.'
    await store.saveCaseBrief(saved)

    expect(store.getBriefById(saved.id).caseName).toBe('Palsgraf v. Long Island Railroad Co.')
    expect(store.getActiveBriefForCourse('contracts')).toBe(saved.id)
  })

  it('saveCaseBrief persists section content keyed by template section', async () => {
    const store = await loadNotesStore()
    const brief = await store.createBlankBrief('contracts')
    brief.caseName = 'Hadley'
    brief.sections.facts = doc('The mill shaft broke.')

    const saved = await store.saveCaseBrief(brief)

    expect(
      supabaseMock.db.brief_sections.find((row) => row.brief_id === saved.id && row.template_section_id === 'sec-facts')
        .content,
    ).toEqual(doc('The mill shaft broke.'))
  })

  it('appendToBriefSection appends to a section and persists just that section', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ courseId: 'contracts', caseName: 'Hadley' })

    await store.appendToBriefSection({
      briefId: brief.id,
      sectionKey: 'facts',
      nodes: [{ type: 'paragraph', content: [{ type: 'text', text: 'the holding text' }] }],
    })

    expect(JSON.stringify(store.getBriefById(brief.id).sections.facts)).toContain('the holding text')
    const row = supabaseMock.db.brief_sections.find(
      (r) => r.brief_id === brief.id && r.template_section_id === 'sec-facts',
    )
    expect(row).toBeTruthy()
    expect(JSON.stringify(row.content)).toContain('the holding text')
  })

  it('appendToBriefSection appends without overwriting existing content', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ courseId: 'contracts', caseName: 'Hadley' })

    await store.appendToBriefSection({
      briefId: brief.id,
      sectionKey: 'facts',
      nodes: [{ type: 'paragraph', content: [{ type: 'text', text: 'first' }] }],
    })
    await store.appendToBriefSection({
      briefId: brief.id,
      sectionKey: 'facts',
      nodes: [{ type: 'paragraph', content: [{ type: 'text', text: 'second' }] }],
    })

    const dump = JSON.stringify(store.getBriefById(brief.id).sections.facts)
    expect(dump).toContain('first')
    expect(dump).toContain('second')
    // upsert keeps a single row for the section
    expect(
      supabaseMock.db.brief_sections.filter(
        (r) => r.brief_id === brief.id && r.template_section_id === 'sec-facts',
      ),
    ).toHaveLength(1)
  })

  it('appendToBriefSection throws on an unknown section key', async () => {
    const store = await loadNotesStore()
    const brief = await store.createAndSaveBrief({ courseId: 'contracts', caseName: 'Hadley' })
    await expect(
      store.appendToBriefSection({ briefId: brief.id, sectionKey: 'nope', nodes: [] }),
    ).rejects.toThrow(/unknown brief section/i)
  })

  it('seed courses start with an empty outline', async () => {
    const store = await loadNotesStore()
    expect(store.getCourseById('contracts').outline).toEqual(EMPTY_DOC)
  })

  it('updateOutline sets the outline content for an existing course', async () => {
    const store = await loadNotesStore()
    store.updateOutline('contracts', doc('Formation requires offer, acceptance, consideration.'))

    expect(store.getCourseById('contracts').outline).toEqual(
      doc('Formation requires offer, acceptance, consideration.'),
    )
  })

  it('updateOutline does nothing for an unknown course id', async () => {
    const store = await loadNotesStore()
    expect(() => store.updateOutline('does-not-exist', doc('x'))).not.toThrow()
  })

  it('updateOutline persists to Supabase after the debounce window, coalescing rapid edits', async () => {
    vi.useFakeTimers()
    try {
      const store = await loadNotesStore()
      store.updateOutline('contracts', doc('first'))
      store.updateOutline('contracts', doc('second'))

      await vi.advanceTimersByTimeAsync(600)

      const row = supabaseMock.db.classes.find((course) => course.id === 'contracts')
      expect(row.outline).toEqual(doc('second'))
    } finally {
      vi.useRealTimers()
    }
  })

  it('a new course created via addCourse starts with an empty outline', async () => {
    const store = await loadNotesStore()
    const created = await store.addCourse({ title: 'Evidence', focus: 'Relevance and hearsay.' })

    expect(created.outline).toEqual(EMPTY_DOC)
    expect(supabaseMock.db.classes.find((course) => course.id === created.id)).toBeTruthy()
  })

  it('getActiveBriefForCourse returns null when no brief has been set as active', async () => {
    const store = await loadNotesStore()
    expect(store.getActiveBriefForCourse('contracts')).toBeNull()
  })

  it('deleteCourse removes the course locally and from Supabase', async () => {
    const store = await loadNotesStore()
    expect(store.getCourseById('contracts')).toBeTruthy()

    await store.deleteCourse('contracts')

    expect(store.getCourseById('contracts')).toBeUndefined()
    expect(supabaseMock.db.classes.find((course) => course.id === 'contracts')).toBeUndefined()
    // The mock has no FK-cascade simulation, so case_briefs/brief_sections cascade
    // cleanup is only verified against the real database (see manual smoke test).
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
