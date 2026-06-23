<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { onMounted } from 'vue'
import { useForm } from 'vee-validate'

import { classSchema } from '@/schemas/classSchema'
import { useNotesStore } from '@/stores/notesStore'

const notesStore = useNotesStore()

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(classSchema),
})
const [newTitle] = defineField('title')
const [newFocus] = defineField('focus')

onMounted(() => {
  notesStore.fetchClasses()
})

const handleAddClass = handleSubmit(async (values) => {
  await notesStore.addClass(values)
  resetForm()
})
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="label">Course outlines</p>
          <h2>Track your materials by class.</h2>
        </div>
        <p class="supporting-copy">
          Keep each course anchored around the rules, cases, and exam prep resources you revisit
          throughout the semester.
        </p>
      </div>

      <div class="outline-list">
        <RouterLink
          v-for="cls in notesStore.classes"
          :key="cls.id"
          :to="`/class/${cls.id}`"
          class="outline-card"
        >
          <h3>{{ cls.title }}</h3>
          <p>{{ cls.focus }}</p>
        </RouterLink>
      </div>

      <form class="new-class-form" @submit.prevent="handleAddClass">
        <p class="label">New class</p>
        <div class="new-class-fields">
          <input v-model.trim="newTitle" type="text" placeholder="Class name">
          <input v-model.trim="newFocus" type="text" placeholder="Focus (optional)">
          <button type="submit">Add class</button>
        </div>
        <span v-if="errors.title" class="field-error">{{ errors.title }}</span>
      </form>
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
h3,
p,
ul {
  margin-top: 0;
}

h2 {
  margin-bottom: 0;
  font-size: 1.8rem;
}

.supporting-copy {
  max-width: 42rem;
  margin-bottom: 0;
  line-height: 1.65;
}

.outline-list {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.outline-card {
  display: block;
  padding: 1.25rem;
  border-radius: 1rem;
  background: var(--color-bg-alt);
  text-decoration: none;
  transition: box-shadow 0.2s ease;
}

.outline-card:hover {
  box-shadow: 0 10px 25px var(--shadow-color);
}

.outline-card p {
  line-height: 1.6;
}

.new-class-form {
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.new-class-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.new-class-fields input {
  flex: 1;
  min-width: 10rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
}

.new-class-fields button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 0.9rem;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  cursor: pointer;
}

.field-error {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}
</style>
