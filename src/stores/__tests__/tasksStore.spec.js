import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'

const TEST_USER_ID = 'test-user-id'

const defaultTasks = [
  {
    id: 'task-1',
    user_id: TEST_USER_ID,
    title: 'Outline Contracts',
    description: '',
    status: 'todo',
    position: 0,
    start_date: '2026-06-01',
    due_date: '2026-06-03',
    tags: ['reading'],
    course_id: null,
  },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function loadTasksStore() {
  const { useAuthStore } = await import('@/stores/auth')
  useAuthStore().user = { id: TEST_USER_ID }

  const { useTasksStore } = await import('../tasksStore')
  const store = useTasksStore()
  await store.fetchTasks()
  return store
}

describe('useTasksStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    supabaseMock = createSupabaseMock({ tasks: defaultTasks })
  })

  it('updateTaskSchedule updates the local task and persists new dates', async () => {
    const store = await loadTasksStore()

    await store.updateTaskSchedule('task-1', { startDate: '2026-06-05', dueDate: '2026-06-09' })

    const task = store.tasks.find((t) => t.id === 'task-1')
    expect(task.startDate).toBe('2026-06-05')
    expect(task.dueDate).toBe('2026-06-09')

    const row = supabaseMock.db.tasks.find((r) => r.id === 'task-1')
    expect(row.start_date).toBe('2026-06-05')
    expect(row.due_date).toBe('2026-06-09')
  })

  it('updateTaskSchedule reverts the local task when the write fails', async () => {
    const store = await loadTasksStore()
    vi.spyOn(supabaseMock, 'from').mockImplementationOnce(() => ({
      update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: { message: 'nope' } }) }) }),
    }))

    await expect(
      store.updateTaskSchedule('task-1', { startDate: '2026-06-05', dueDate: '2026-06-09' }),
    ).rejects.toBeTruthy()

    const task = store.tasks.find((t) => t.id === 'task-1')
    expect(task.startDate).toBe('2026-06-01')
    expect(task.dueDate).toBe('2026-06-03')
  })

  it('setTaskStatus updates the local task status and persists it', async () => {
    const store = await loadTasksStore()

    await store.setTaskStatus('task-1', 'done')

    expect(store.tasks.find((t) => t.id === 'task-1').status).toBe('done')
    expect(supabaseMock.db.tasks.find((r) => r.id === 'task-1').status).toBe('done')
  })

  it('addTask appends a new task with parsed tags and null-coalesced dates', async () => {
    const store = await loadTasksStore()

    const created = await store.addTask({ title: 'New', tags: 'a, b', startDate: '', dueDate: '2026-07-01' })

    expect(created.title).toBe('New')
    expect(created.tags).toEqual(['a', 'b'])
    expect(created.dueDate).toBe('2026-07-01')
    expect(store.tasks.some((t) => t.id === created.id)).toBe(true)
  })
})
