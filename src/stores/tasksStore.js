import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

export const TASK_STATUSES = ['todo', 'in_progress', 'done']

function shapeTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    startDate: row.start_date,
    dueDate: row.due_date,
  }
}

export const useTasksStore = defineStore('tasks', () => {
  const authStore = useAuthStore()
  const tasks = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  function getUserId() {
    const userId = authStore.user?.id
    if (!userId) throw new Error('No authenticated user — cannot access tasks while logged out.')
    return userId
  }

  async function fetchTasks() {
    isLoading.value = true
    error.value = null
    try {
      const { data, error: dbError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', getUserId())
        .order('position')
      if (dbError) throw dbError
      tasks.value = data.map(shapeTask)
      return tasks.value
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function addTask({ title, description, startDate, dueDate }) {
    const userId = getUserId()
    const status = 'todo'
    const position = tasks.value.filter((task) => task.status === status).length
    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        description: description ?? '',
        status,
        position,
        start_date: startDate || null,
        due_date: dueDate || null,
      })
      .select()
      .single()
    if (insertError) throw insertError

    const created = shapeTask(data)
    tasks.value.push(created)
    return created
  }

  async function deleteTask(id) {
    tasks.value = tasks.value.filter((task) => task.id !== id)
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', getUserId())
    if (deleteError) throw deleteError
  }

  // Called after a drag-and-drop reorder (within or across columns). The
  // dragged task objects are the same references held in `tasks`, so the
  // column arrays built from `tasks` already reflect the new status/position
  // by the time this runs — persist that state to Supabase.
  async function persistAll() {
    const userId = getUserId()
    const updates = tasks.value.map((task) =>
      supabase
        .from('tasks')
        .update({ status: task.status, position: task.position })
        .eq('id', task.id)
        .eq('user_id', userId),
    )
    const results = await Promise.all(updates)
    const failed = results.find((result) => result.error)
    if (failed) throw failed.error
  }

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    addTask,
    deleteTask,
    persistAll,
  }
})
