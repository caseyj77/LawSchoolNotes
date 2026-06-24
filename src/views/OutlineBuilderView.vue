<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import RichTextEditor from '@/components/RichTextEditor.vue'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const notesStore = useNotesStore()

const course = computed(() => notesStore.getCourseById(route.params.courseId))

const outlineContent = computed({
  get: () => course.value?.outline ?? { type: 'doc', content: [] },
  set: (value) => notesStore.updateOutline(route.params.courseId, value),
})
</script>

<template>
  <section v-if="course" class="content-grid">
    <article class="panel">
      <p class="label">Outline builder</p>
      <h2>{{ course.title }}</h2>
      <p class="supporting-copy">
        Build your outline here, or capture excerpts into it from the document reader.
      </p>

      <RichTextEditor
        v-model="outlineContent"
        label="Outline"
        placeholder="Start building your outline…"
      />

      <RouterLink :to="`/course/${course.id}`" class="back-link">← Back to course</RouterLink>
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
  margin: 1rem 0;
  line-height: 1.65;
}

.back-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
}
</style>
