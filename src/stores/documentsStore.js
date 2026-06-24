import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

const BUCKET = 'documents'

function shapeDocument(row) {
  return {
    id: row.id,
    courseId: row.course_id,
    filename: row.filename,
    storagePath: row.storage_path,
    fileType: row.file_type,
    createdAt: row.created_at,
  }
}

function detectFileType(filename) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.docx')) return 'docx'
  return null
}

export const useDocumentsStore = defineStore('documents', () => {
  const authStore = useAuthStore()
  const documents = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  function getUserId() {
    const userId = authStore.user?.id
    if (!userId) throw new Error('No authenticated user — cannot access documents while logged out.')
    return userId
  }

  async function fetchDocuments(courseId) {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('documents')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', getUserId())
        .order('created_at', { ascending: false })
      if (dbError) throw dbError
      documents.value = data.map(shapeDocument)
      return documents.value
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function uploadDocument(courseId, file) {
    const fileType = detectFileType(file.name)
    if (!fileType) throw new Error('Only .pdf and .docx files are supported.')

    const userId = getUserId()
    const storagePath = `${userId}/${courseId}/${crypto.randomUUID()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file)
    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        course_id: courseId,
        filename: file.name,
        storage_path: storagePath,
        file_type: fileType,
      })
      .select()
      .single()
    if (insertError) throw insertError

    const created = shapeDocument(data)
    documents.value.unshift(created)
    return created
  }

  async function downloadDocument(storagePath) {
    const { data, error: downloadError } = await supabase.storage.from(BUCKET).download(storagePath)
    if (downloadError) throw downloadError
    return data.arrayBuffer()
  }

  async function deleteDocument(id) {
    const target = documents.value.find((doc) => doc.id === id)
    if (!target) return

    documents.value = documents.value.filter((doc) => doc.id !== id)

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([target.storagePath])
    if (removeError) throw removeError

    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', getUserId())
    if (deleteError) throw deleteError
  }

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
  }
})
