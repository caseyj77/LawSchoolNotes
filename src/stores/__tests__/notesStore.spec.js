import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useActiveBriefStore } from '../activeBriefStore'
import { useNotesStore } from '../notesStore'

describe('useNotesStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('createAndSaveBrief generates an id, sets classId, and starts with blank sections', () => {
    const store = useNotesStore()
    const brief = store.createAndSaveBrief({ classId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(brief.id).toBeTruthy()
    expect(brief.classId).toBe('contracts')
    expect(brief.caseName).toBe('Hadley v. Baxendale')
    expect(brief.facts).toBe('')
    expect(store.getBriefById(brief.id).caseName).toBe('Hadley v. Baxendale')
  })

  it('createAndSaveBrief marks the new brief as the active brief for its class', () => {
    const store = useNotesStore()
    const activeBriefStore = useActiveBriefStore()
    const brief = store.createAndSaveBrief({ classId: 'contracts', caseName: 'Hadley v. Baxendale' })

    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(brief.id)
  })

  it('saveCaseBrief updates the active brief store for both new and existing briefs', () => {
    const store = useNotesStore()
    const activeBriefStore = useActiveBriefStore()

    const brief = store.createBlankBrief('contracts')
    brief.caseName = 'Palsgraf'
    store.saveCaseBrief(brief)

    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(brief.id)

    brief.caseName = 'Palsgraf v. Long Island Railroad Co.'
    store.saveCaseBrief(brief)

    expect(store.getBriefById(brief.id).caseName).toBe('Palsgraf v. Long Island Railroad Co.')
    expect(activeBriefStore.getActiveBriefForClass('contracts')).toBe(brief.id)
  })

  it('seed classes start with an empty outline', () => {
    const store = useNotesStore()
    expect(store.getClassById('contracts').outline).toBe('')
  })

  it('updateOutline sets the outline HTML for an existing class', () => {
    const store = useNotesStore()
    store.updateOutline('contracts', '<p>Formation requires offer, acceptance, consideration.</p>')

    expect(store.getClassById('contracts').outline).toBe(
      '<p>Formation requires offer, acceptance, consideration.</p>',
    )
  })

  it('updateOutline does nothing for an unknown class id', () => {
    const store = useNotesStore()
    expect(() => store.updateOutline('does-not-exist', '<p>x</p>')).not.toThrow()
  })

  it('a new class created via addClass starts with an empty outline', () => {
    const store = useNotesStore()
    const created = store.addClass({ title: 'Evidence', focus: 'Relevance and hearsay.' })

    expect(created.outline).toBe('')
  })
})
