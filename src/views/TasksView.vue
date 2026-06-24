<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { computed, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import draggable from 'vuedraggable'
import { VueDatePicker } from '@vuepic/vue-datepicker'

import { taskSchema } from '@/schemas/taskSchema'
import { TASK_STATUSES, useTasksStore } from '@/stores/tasksStore'
import { useNotesStore } from '@/stores/notesStore'

const COLUMNS = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]

const tasksStore = useTasksStore()
const notesStore = useNotesStore()
const isLoading = ref(true)

// vuedraggable needs a plain, settable ref per column to splice/reassign
// during drag — a computed derived from tasksStore.tasks can't serve as the
// v-model target. These hold the same task object references as
// tasksStore.tasks, so mutating a task's fields here also updates the store.
const todoTasks = ref([])
const inProgressTasks = ref([])
const doneTasks = ref([])
const columnRefs = { todo: todoTasks, in_progress: inProgressTasks, done: doneTasks }

function syncColumnsFromStore() {
  for (const status of TASK_STATUSES) {
    columnRefs[status].value = tasksStore.tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.position - b.position)
  }
}

onMounted(async () => {
  await Promise.all([tasksStore.fetchTasks(), notesStore.fetchCourses()])
  syncColumnsFromStore()
  isLoading.value = false
})

function courseColor(courseId) {
  return notesStore.getCourseById(courseId)?.color ?? 'transparent'
}

async function handleDragEnd() {
  for (const status of TASK_STATUSES) {
    columnRefs[status].value.forEach((task, index) => {
      task.status = status
      task.position = index
    })
  }
  await tasksStore.persistAll()
}

const { defineField, errors, handleSubmit, resetForm, setValues } = useForm({
  validationSchema: toTypedSchema(taskSchema),
})
const [title] = defineField('title')
const [description] = defineField('description')
const [startDate] = defineField('startDate')
const [dueDate] = defineField('dueDate')
const [tags] = defineField('tags')
const [courseId] = defineField('courseId')

const isFormOpen = ref(false)
const editingTaskId = ref(null)
const submitLabel = computed(() => (editingTaskId.value ? 'Save changes' : 'Add task'))

function openCreateForm() {
  editingTaskId.value = null
  resetForm()
  isFormOpen.value = true
}

function openEditForm(task) {
  editingTaskId.value = task.id
  setValues({
    title: task.title,
    description: task.description,
    startDate: task.startDate ?? '',
    dueDate: task.dueDate ?? '',
    tags: task.tags.join(', '),
    courseId: task.courseId ?? '',
  })
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  editingTaskId.value = null
  resetForm()
}

const handleSubmitTask = handleSubmit(async (values) => {
  if (editingTaskId.value) {
    await tasksStore.updateTask(editingTaskId.value, values)
  } else {
    await tasksStore.addTask(values)
  }
  syncColumnsFromStore()
  closeForm()
})

async function handleDeleteTask(id) {
  await tasksStore.deleteTask(id)
  syncColumnsFromStore()
}
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="label">Tasks</p>
          <h2>Track what's due across every class.</h2>
        </div>
        <button type="button" class="add-task-button" @click="openCreateForm">+ New task</button>
      </div>

      <form v-if="isFormOpen" class="task-form" @submit.prevent="handleSubmitTask">
        <div class="task-form-fields">
          <label>
            Title
            <input v-model.trim="title" type="text" placeholder="Outline Contracts Ch. 4">
            <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
          </label>
          <label>
            Description
            <input v-model.trim="description" type="text" placeholder="Optional notes">
          </label>
          <label>
            Start date
            <VueDatePicker
              v-model="startDate"
              model-type="yyyy-MM-dd"
              format="MMM d, yyyy"
              :enable-time-picker="false"
              auto-apply
              placeholder="Optional"
            />
          </label>
          <label>
            Due date
            <VueDatePicker
              v-model="dueDate"
              model-type="yyyy-MM-dd"
              format="MMM d, yyyy"
              :enable-time-picker="false"
              auto-apply
              placeholder="Optional"
            />
          </label>
          <label>
            Tags
            <input v-model.trim="tags" type="text" placeholder="reading, exam-prep">
          </label>
          <label>
            Course
            <select v-model="courseId" class="task-course-select">
              <option value="">No course</option>
              <option v-for="course in notesStore.courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </label>
        </div>
        <div class="task-form-actions">
          <button type="submit" class="save-button">{{ submitLabel }}</button>
          <button type="button" class="cancel-button" @click="closeForm">Cancel</button>
        </div>
      </form>

      <p v-if="isLoading" class="supporting-copy">Loading tasks…</p>

      <div v-else class="board">
        <div v-for="column in COLUMNS" :key="column.status" class="board-column">
          <p class="column-label">{{ column.label }}</p>
          <draggable
            v-model="columnRefs[column.status].value"
            group="tasks"
            item-key="id"
            class="column-list"
            ghost-class="task-card-ghost"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <article class="task-card">
                <p class="task-title">{{ element.title }}</p>
                <p v-if="element.description" class="task-description">{{ element.description }}</p>
                <p v-if="element.startDate || element.dueDate" class="task-dates">
                  <span v-if="element.startDate">Start {{ element.startDate }}</span>
                  <span v-if="element.dueDate">Due {{ element.dueDate }}</span>
                </p>
                <p v-if="element.tags.length" class="task-tags">
                  <span v-for="tag in element.tags" :key="tag" class="tag-pill">{{ tag }}</span>
                </p>
                <div class="task-card-buttons">
                  <button
                    type="button"
                    class="task-edit"
                    aria-label="Edit task"
                    @click="openEditForm(element)"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    class="task-delete"
                    aria-label="Delete task"
                    @click="handleDeleteTask(element.id)"
                  >
                    ×
                  </button>
                </div>
                <div class="task-course-bar" :style="{ background: courseColor(element.courseId) }"></div>
              </article>
            </template>
          </draggable>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
}

.panel {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: var(--color-panel-bg);
  box-shadow: 0 18px 45px var(--shadow-color-light);
}

.panel-wide {
  display: grid;
  gap: 1.5rem;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

h2 {
  margin: 0;
  font-size: 1.8rem;
}

.add-task-button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 999px;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.task-form {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-bg-alt);
}

.task-form-fields {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.task-form label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

.task-form input,
.task-course-select {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
}

.field-error {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}

.task-form-actions {
  display: flex;
  gap: 0.75rem;
}

.save-button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 999px;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

.supporting-copy {
  max-width: 42rem;
  line-height: 1.65;
}

.board {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 900px) {
  .board {
    grid-template-columns: 1fr;
  }
}

.board-column {
  display: grid;
  gap: 0.75rem;
  align-content: start;
  min-height: 8rem;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--color-bg-alt);
}

.column-label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
}

.column-list {
  display: grid;
  gap: 0.6rem;
  min-height: 3rem;
}

.task-card {
  position: relative;
  padding: 0.85rem 1.5rem 0.85rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-surface);
  box-shadow: 0 8px 20px var(--shadow-color-light);
  cursor: grab;
  overflow: hidden;
}

.task-card-ghost {
  opacity: 0.4;
}

.task-title {
  margin: 0;
  padding-right: 2.25rem;
  font-weight: 600;
}

.task-description {
  margin: 0.35rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.task-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0.5rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-accent);
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.5rem 0 0;
}

.tag-pill {
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: var(--color-bg-alt);
  color: var(--color-accent);
  font-size: 0.72rem;
  font-weight: 600;
}

.task-card-buttons {
  position: absolute;
  top: 0.5rem;
  right: 0.85rem;
  display: flex;
  gap: 0.35rem;
}

.task-edit,
.task-delete {
  border: none;
  background: none;
  color: var(--color-disabled);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.task-edit:hover {
  color: var(--color-accent);
}

.task-delete:hover {
  color: var(--color-error);
}

.task-course-bar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 5%;
}
</style>
