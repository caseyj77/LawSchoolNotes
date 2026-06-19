import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { useActiveBriefStore } from '../activeBriefStore'

describe('useActiveBriefStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('returns null for a class with no active brief yet', () => {
    const store = useActiveBriefStore()
    expect(store.getActiveBriefForClass('contracts')).toBeNull()
  })

  it('sets and gets the active brief for a class', () => {
    const store = useActiveBriefStore()
    store.setActiveBriefForClass('contracts', 'brief-1')

    expect(store.getActiveBriefForClass('contracts')).toBe('brief-1')
  })

  it('persists the active brief map to localStorage', async () => {
    const store = useActiveBriefStore()
    store.setActiveBriefForClass('contracts', 'brief-1')
    await nextTick()

    const stored = JSON.parse(localStorage.getItem('law-school-active-briefs'))
    expect(stored).toEqual({ contracts: 'brief-1' })
  })

  it('loads a previously persisted active brief map on init', () => {
    localStorage.setItem('law-school-active-briefs', JSON.stringify({ torts: 'brief-2' }))
    const store = useActiveBriefStore()

    expect(store.getActiveBriefForClass('torts')).toBe('brief-2')
  })
})
