import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'
import { useAnnotationsStore } from '@/stores/annotationsStore'
import { useAuthStore } from '@/stores/auth'

const TEST_USER_ID = 'test-user-id'
const DOC_A = 'doc-a'
const DOC_B = 'doc-b'

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

function seededAnnotations() {
  return [
    {
      id: 'ann-1',
      user_id: TEST_USER_ID,
      document_id: DOC_A,
      source_type: 'pdf',
      kind: 'highlight',
      color: 'yellow',
      page_index: 0,
      anchor: { rects: [{ x: 0.1, y: 0.2, w: 0.3, h: 0.02 }] },
      quote: 'first',
      comment: null,
      created_at: '2026-06-24T00:00:00.000Z',
      updated_at: '2026-06-24T00:00:00.000Z',
    },
    {
      id: 'ann-2',
      user_id: TEST_USER_ID,
      document_id: DOC_A,
      source_type: 'html',
      kind: 'note',
      color: 'green',
      page_index: null,
      anchor: { quote: { exact: 'second' }, position: { start: 10, end: 16 } },
      quote: 'second',
      comment: { type: 'doc', content: [] },
      created_at: '2026-06-24T01:00:00.000Z',
      updated_at: '2026-06-24T01:00:00.000Z',
    },
    {
      id: 'ann-3',
      user_id: TEST_USER_ID,
      document_id: DOC_B,
      source_type: 'pdf',
      kind: 'highlight',
      color: 'blue',
      page_index: 2,
      anchor: { rects: [] },
      quote: 'other doc',
      comment: null,
      created_at: '2026-06-24T02:00:00.000Z',
      updated_at: '2026-06-24T02:00:00.000Z',
    },
  ]
}

describe('annotationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    supabaseMock = createSupabaseMock({ annotations: seededAnnotations() })
    useAuthStore().user = { id: TEST_USER_ID }
  })

  it('fetches a document\'s annotations, shaped and scoped to that document', async () => {
    const store = useAnnotationsStore()

    const result = await store.fetchAnnotations(DOC_A)

    expect(result).toHaveLength(2)
    expect(store.byDocument[DOC_A]).toHaveLength(2)
    expect(store.byDocument[DOC_B]).toBeUndefined()
    // snake_case -> camelCase shaping
    expect(store.byDocument[DOC_A][0]).toMatchObject({
      id: 'ann-1',
      documentId: DOC_A,
      sourceType: 'pdf',
      pageIndex: 0,
      quote: 'first',
    })
    // ordered by created_at ascending
    expect(store.byDocument[DOC_A].map((a) => a.id)).toEqual(['ann-1', 'ann-2'])
  })

  it('toggles isLoading around the fetch and clears error on success', async () => {
    const store = useAnnotationsStore()

    const pending = store.fetchAnnotations(DOC_A)
    expect(store.isLoading).toBe(true)
    await pending
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('throws when fetching while logged out', async () => {
    useAuthStore().user = null
    const store = useAnnotationsStore()

    await expect(store.fetchAnnotations(DOC_A)).rejects.toThrow(/no authenticated user/i)
    expect(store.isLoading).toBe(false)
  })

  it('guards Phase 1+ mutations until they are implemented', () => {
    const store = useAnnotationsStore()
    expect(() => store.create()).toThrow(/not implemented/i)
    expect(() => store.update()).toThrow(/not implemented/i)
    expect(() => store.remove()).toThrow(/not implemented/i)
  })
})
