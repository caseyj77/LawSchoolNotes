<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { computed, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { useRoute, useRouter } from 'vue-router'

import { isJsonDocEmpty, renderRichTextToHtml } from '@/lib/renderRichText'
import { courseSchema } from '@/schemas/courseSchema'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const courseId = computed(() => route.params.courseId)
const course = computed(() => notesStore.getCourseById(courseId.value))
const briefs = computed(() => notesStore.getBriefsForCourse(courseId.value))
const isLoading = ref(true)

onMounted(async () => {
  await notesStore.loadBriefsForCourse(courseId.value)
  isLoading.value = false
})

async function handleDeleteCourse() {
  const count = briefs.value.length
  const message =
    count > 0
      ? `Delete "${course.value.title}" and its ${count} case brief${count === 1 ? '' : 's'}?`
      : `Delete "${course.value.title}"?`
  if (!window.confirm(message)) return
  await notesStore.deleteCourse(courseId.value)
  router.push({ name: 'course-outlines' })
}

const { defineField, errors, handleSubmit, setValues } = useForm({
  validationSchema: toTypedSchema(courseSchema),
})
const [editTitle] = defineField('title')
const [editFocus] = defineField('focus')
const [editColor] = defineField('color')

const isEditing = ref(false)

function openEdit() {
  setValues({
    title: course.value.title,
    focus: course.value.focus,
    color: course.value.color,
  })
  isEditing.value = true
}

function closeEdit() {
  isEditing.value = false
}

const handleSaveCourse = handleSubmit(async (values) => {
  await notesStore.updateCourse(courseId.value, values)
  isEditing.value = false
})
</script>

<template>
  <section v-if="course" class="content-grid">
    <article class="panel panel-wide">
      <div v-if="!isEditing" class="panel-header">
        <div>
          <p class="label">Course</p>
          <h2>{{ course.title }}</h2>
        </div>
        <p class="supporting-copy">{{ course.focus }}</p>
        <div class="header-buttons">
          <button type="button" class="edit-button" @click="openEdit">Edit course</button>
          <button type="button" class="danger" @click="handleDeleteCourse">Delete course</button>
        </div>
      </div>

      <form v-else class="edit-form" @submit.prevent="handleSaveCourse">
        <label>
          Title
          <input v-model.trim="editTitle" type="text">
          <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
        </label>
        <label>
          Description
          <input v-model.trim="editFocus" type="text" placeholder="Focus (optional)">
        </label>
        <label>
          Color
          <input v-model="editColor" type="color" class="color-input" aria-label="Course color">
        </label>
        <div class="header-buttons">
          <button type="submit" class="save-button">Save changes</button>
          <button type="button" class="cancel-button" @click="closeEdit">Cancel</button>
        </div>
      </form>
    </article>

    <article class="panel">
      <p class="label">Outline</p>
      <p v-if="!isJsonDocEmpty(course.outline)" class="supporting-copy outline-preview" v-html="renderRichTextToHtml(course.outline)"></p>
      <p v-else class="supporting-copy">No outline yet.</p>
      <RouterLink :to="`/course/${courseId}/outline`">Open outline builder</RouterLink>
    </article>

    <article class="panel">
      <p class="label">Document reader</p>
      <p class="supporting-copy">Read a case and build your brief side by side.</p>
      <RouterLink :to="`/course/${courseId}/reader`">Open document reader</RouterLink>
    </article>

    <article class="panel">
      <p class="label">Case briefs</p>
      <p v-if="isLoading" class="supporting-copy">Loading case briefs…</p>
      <ul v-else-if="briefs.length" class="brief-list">
        <li v-for="brief in briefs" :key="brief.id">
          <RouterLink :to="`/course/${courseId}/case-briefs/${brief.id}`">
            {{ brief.caseName || 'Untitled case brief' }}
            <span v-if="brief.citation" class="citation">{{ brief.citation }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="supporting-copy">No case briefs yet.</p>
      <RouterLink :to="`/course/${courseId}/case-briefs/new`">Add case brief</RouterLink>
    </article>
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
  gap: 1.5rem;
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
  display: grid;
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

h2,
p {
  margin-top: 0;
}

h2 {
  margin-bottom: 0;
  font-size: 1.8rem;
}

.supporting-copy {
  max-width: 42rem;
  line-height: 1.65;
}

.brief-list {
  display: grid;
  gap: 0.75rem;
  padding-left: 0;
  margin: 0 0 1rem;
  list-style: none;
}

.brief-list a {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 0.9rem;
  background: var(--color-bg-alt);
  text-decoration: none;
}

.citation {
  color: var(--color-text-secondary);
}

.outline-preview {
  max-height: 4.8rem;
  overflow: hidden;
}

.outline-preview :deep(p) {
  margin: 0 0 0.5rem;
}

.header-buttons {
  display: flex;
  gap: 0.75rem;
}

.danger {
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-error);
  border-radius: 0.9rem;
  background: var(--color-surface);
  color: var(--color-error);
  cursor: pointer;
  font: inherit;
}

.edit-button {
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
}

.edit-form {
  display: grid;
  gap: 1rem;
}

.edit-form label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

.edit-form input {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
}

.edit-form .color-input {
  width: 3rem;
  padding: 0.2rem;
}

.field-error {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}

.save-button {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 0.9rem;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button {
  padding: 0.6rem 1.2rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}
</style>
