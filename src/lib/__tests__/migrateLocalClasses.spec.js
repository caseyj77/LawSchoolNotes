import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadMigrate() {
  const { migrateLocalClassesToSupabase } = await import('../migrateLocalClasses')
  return migrateLocalClassesToSupabase
}

describe('migrateLocalClassesToSupabase', () => {
  beforeEach(() => {
    localStorage.clear()
    supabaseMock = createSupabaseMock()
  })

  it('is a no-op when there is no legacy data', async () => {
    const migrate = await loadMigrate()
    const result = await migrate()

    expect(result).toEqual({ migrated: 0 })
    expect(supabaseMock.db.classes ?? []).toHaveLength(0)
  })

  it('upserts legacy classes, including their outline, into the classes table', async () => {
    localStorage.setItem(
      'law-school-classes',
      JSON.stringify([
        { id: 'contracts', title: 'Contracts', focus: 'Formation and remedies.', outline: '<p>Offer, acceptance.</p>' },
        { id: 'torts', title: 'Torts', focus: 'Negligence.', outline: '' },
      ]),
    )

    const migrate = await loadMigrate()
    const result = await migrate()

    expect(result).toEqual({ migrated: 2 })

    const contracts = supabaseMock.db.classes.find((row) => row.id === 'contracts')
    expect(contracts.title).toBe('Contracts')
    expect(contracts.focus).toBe('Formation and remedies.')
    expect(contracts.outline).toBe('<p>Offer, acceptance.</p>')
  })

  it('migrates the active-brief pointer for each class when present', async () => {
    localStorage.setItem(
      'law-school-classes',
      JSON.stringify([{ id: 'contracts', title: 'Contracts', focus: '', outline: '' }]),
    )
    localStorage.setItem('law-school-active-briefs', JSON.stringify({ contracts: 'brief-1' }))

    const migrate = await loadMigrate()
    await migrate()

    const contracts = supabaseMock.db.classes.find((row) => row.id === 'contracts')
    expect(contracts.last_active_brief_id).toBe('brief-1')
  })

  it('defaults last_active_brief_id to null when no active-brief entry exists for a class', async () => {
    localStorage.setItem(
      'law-school-classes',
      JSON.stringify([{ id: 'contracts', title: 'Contracts', focus: '', outline: '' }]),
    )

    const migrate = await loadMigrate()
    await migrate()

    const contracts = supabaseMock.db.classes.find((row) => row.id === 'contracts')
    expect(contracts.last_active_brief_id).toBeNull()
  })

  it('does not re-run once the migration flag is set', async () => {
    localStorage.setItem(
      'law-school-classes',
      JSON.stringify([{ id: 'contracts', title: 'Contracts', focus: '', outline: '' }]),
    )

    const migrate = await loadMigrate()
    await migrate()
    const secondRun = await migrate()

    expect(secondRun).toEqual({ migrated: 0 })
    expect(supabaseMock.db.classes).toHaveLength(1)
  })

  it('is safe to call twice without duplicating rows (upsert by id)', async () => {
    localStorage.setItem(
      'law-school-classes',
      JSON.stringify([{ id: 'contracts', title: 'Contracts', focus: '', outline: '' }]),
    )

    const migrate = await loadMigrate()
    await migrate()
    localStorage.removeItem('law-school-classes-migrated-to-supabase')
    await migrate()

    expect(supabaseMock.db.classes).toHaveLength(1)
  })
})
