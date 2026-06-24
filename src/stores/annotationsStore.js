import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

function shapeAnnotation(row) {
  return {
    id: row.id,
    documentId: row.document_id,
    // 'pdf' | 'html'. Maps from documents.file_type: 'docx' renders to HTML via
    // mammoth, so a docx document's annotations are stored as source_type 'html'.
    sourceType: row.source_type,
    kind: row.kind,
    color: row.color,
    pageIndex: row.page_index,
    anchor: row.anchor,
    quote: row.quote,
    comment: row.comment,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const useAnnotationsStore = defineStore('annotations', () => {
  const authStore = useAuthStore()
  // Keyed by documentId so several open documents can each hold their own list.
  const byDocument = ref({})
  const activeId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  function getUserId() {
    const userId = authStore.user?.id
    if (!userId) throw new Error('No authenticated user — cannot access annotations while logged out.')
    return userId
  }

  async function fetchAnnotations(documentId) {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('annotations')
        .select('*')
        .eq('document_id', documentId)
        .eq('user_id', getUserId())
        .order('created_at', { ascending: true })
      if (dbError) throw dbError
      byDocument.value[documentId] = data.map(shapeAnnotation)
      return byDocument.value[documentId]
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function create(payload) {
    error.value = null
    try {
      const insertRow = {
        user_id: getUserId(),
        document_id: payload.documentId,
        source_type: payload.sourceType,
        kind: payload.kind ?? 'highlight',
        color: payload.color ?? 'yellow',
        page_index: payload.pageIndex ?? null,
        anchor: payload.anchor,
        quote: payload.quote,
        comment: payload.comment ?? null,
      }
      const { data, error: insertError } = await supabase
        .from('annotations')
        .insert(insertRow)
        .select()
        .single()
      if (insertError) throw insertError

      const created = shapeAnnotation(data)
      const list = byDocument.value[created.documentId] ?? (byDocument.value[created.documentId] = [])
      list.push(created)
      return created
    } catch (e) {
      error.value = e
      throw e
    }
  }

  // Phase 2+ — intentionally not implemented yet. Exposed so the store's public
  // API is visible for review, but guarded so nothing wires up to them early.
  function update() {
    throw new Error('annotationsStore.update not implemented (Phase 1+)')
  }

  function remove() {
    throw new Error('annotationsStore.remove not implemented (Phase 1+)')
  }

  return {
    byDocument,
    activeId,
    isLoading,
    error,
    fetchAnnotations,
    create,
    update,
    remove,
  }
})
