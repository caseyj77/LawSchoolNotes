<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import draggable from 'vuedraggable'
import { VueDatePicker } from '@vuepic/vue-datepicker'

import { taskSchema } from '@/schemas/taskSchema'
import { TASK_STATUSES, useTasksStore } from '@/stores/tasksStore'

const COLUMNS = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
]

const tasksStore = useTasksStore()
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
  await tasksStore.fetchTasks()
  syncColumnsFromStore()
  isLoading.value = false
})

async function handleDragEnd() {
  for (const status of TASK_STATUSES) {
    columnRefs[status].value.forEach((task, index) => {
      task.status = status
      task.position = index
    })
  }
  await tasksStore.persistAll()
}

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(taskSchema),
})
const [title] = defineField('title')
const [description] = defineField('description')
const [startDate] = defineField('startDate')
const [dueDate] = defineField('dueDate')

const isFormOpen = ref(false)

function openForm() {
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
  resetForm()
}

const handleAddTask = handleSubmit(async (values) => {
  await tasksStore.addTask(values)
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
        <button type="button" class="add-task-button" @click="openForm">+ New task</button>
      </div>

      <form v-if="isFormOpen" class="task-form" @submit.prevent="handleAddTask">
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
        </div>
        <div class="task-form-actions">
          <button type="submit" class="save-button">Add task</button>
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
                <button
                  type="button"
                  class="task-delete"
                  aria-label="Delete task"
                  @click="handleDeleteTask(element.id)"
                >
                  ×
                </button>
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

.task-form input {
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
  padding: 0.85rem 1rem;
  border-radius: 0.85rem;
  background: var(--color-surface);
  box-shadow: 0 8px 20px var(--shadow-color-light);
  cursor: grab;
}

.task-card-ghost {
  opacity: 0.4;
}

.task-title {
  margin: 0;
  padding-right: 1.25rem;
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

.task-delete {
  position: absolute;
  top: 0.5rem;
  right: 0.6rem;
  border: none;
  background: none;
  color: var(--color-disabled);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.task-delete:hover {
  color: var(--color-error);
}
</style>
