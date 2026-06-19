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
})
