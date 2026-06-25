<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import { VueDatePicker } from '@vuepic/vue-datepicker'

import { taskSchema } from '@/schemas/taskSchema'

// Shared create/edit/delete task form, used by both the Tasks board and the
// calendar (double-click to edit, double-click empty space to create). The
// parent mounts this only while open, so initial values are read from props at
// setup time — no watchers needed.
const props = defineProps({
  // The task to edit, or null to create a new one.
  task: { type: Object, default: null },
  courses: { type: Array, default: () => [] },
  // Prefill dates when creating from a calendar cell (e.g. { startDate, dueDate }).
  presetDates: { type: Object, default: null },
})

const emit = defineEmits(['submit', 'delete', 'close'])

const isEditing = computed(() => Boolean(props.task))
const submitLabel = computed(() => (isEditing.value ? 'Save changes' : 'Add task'))
const heading = computed(() => (isEditing.value ? 'Edit task' : 'New task'))

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: toTypedSchema(taskSchema),
  initialValues: {
    title: props.task?.title ?? '',
    description: props.task?.description ?? '',
    startDate: props.task?.startDate ?? props.presetDates?.startDate ?? '',
    dueDate: props.task?.dueDate ?? props.presetDates?.dueDate ?? '',
    tags: props.task?.tags?.join(', ') ?? '',
    courseId: props.task?.courseId ?? '',
  },
})

const [title] = defineField('title')
const [description] = defineField('description')
const [startDate] = defineField('startDate')
const [dueDate] = defineField('dueDate')
const [tags] = defineField('tags')
const [courseId] = defineField('courseId')

const onSubmit = handleSubmit((values) => {
  emit('submit', { id: props.task?.id ?? null, values })
})

function onDelete() {
  if (props.task) emit('delete', props.task.id)
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ heading }}</h3>
        <button type="button" class="icon-button" aria-label="Close" @click="emit('close')">×</button>
      </div>

      <form class="task-form" @submit.prevent="onSubmit">
        <div class="task-form-fields">
          <label class="field-wide">
            Title
            <input v-model.trim="title" type="text" placeholder="Outline Contracts Ch. 4">
            <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
          </label>
          <label class="field-wide">
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
              <option v-for="course in props.courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
          </label>
        </div>

        <div class="task-form-actions">
          <button type="submit" class="save-button">{{ submitLabel }}</button>
          <button type="button" class="cancel-button" @click="emit('close')">Cancel</button>
          <button v-if="isEditing" type="button" class="delete-button" @click="onDelete">Delete</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(31, 32, 65, 0.45);
}

.modal {
  width: min(46rem, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background: var(--color-surface);
  box-shadow: 0 24px 60px var(--shadow-color-dark);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.icon-button {
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.icon-button:hover {
  color: var(--color-text);
}

.task-form {
  display: grid;
  gap: 1.25rem;
}

.task-form-fields {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field-wide {
  grid-column: 1 / -1;
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
  flex-wrap: wrap;
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

.delete-button {
  margin-left: auto;
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-error);
  border-radius: 999px;
  background: var(--color-error-bg);
  color: var(--color-error);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
</style>
