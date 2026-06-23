<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { isJsonDocEmpty, renderRichTextToHtml } from '@/lib/renderRichText'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const classId = computed(() => route.params.classId)
const cls = computed(() => notesStore.getClassById(classId.value))
const briefs = computed(() => notesStore.getBriefsForClass(classId.value))
const isLoading = ref(true)

onMounted(async () => {
  await notesStore.loadBriefsForClass(classId.value)
  isLoading.value = false
})

async function handleDeleteClass() {
  const count = briefs.value.length
  const message =
    count > 0
      ? `Delete "${cls.value.title}" and its ${count} case brief${count === 1 ? '' : 's'}?`
      : `Delete "${cls.value.title}"?`
  if (!window.confirm(message)) return
  await notesStore.deleteClass(classId.value)
  router.push({ name: 'course-outlines' })
}
</script>

<template>
  <section v-if="cls" class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="label">Class</p>
          <h2>{{ cls.title }}</h2>
        </div>
        <p class="supporting-copy">{{ cls.focus }}</p>
        <button type="button" class="danger" @click="handleDeleteClass">Delete class</button>
      </div>
    </article>

    <article class="panel">
      <p class="label">Outline</p>
      <p v-if="!isJsonDocEmpty(cls.outline)" class="supporting-copy outline-preview" v-html="renderRichTextToHtml(cls.outline)"></p>
      <p v-else class="supporting-copy">No outline yet.</p>
      <RouterLink :to="`/class/${classId}/outline`">Open outline builder</RouterLink>
    </article>

    <article class="panel">
      <p class="label">Document reader</p>
      <p class="supporting-copy">Read a case and build your brief side by side.</p>
      <RouterLink :to="`/class/${classId}/reader`">Open document reader</RouterLink>
    </article>

    <article class="panel">
      <p class="label">Case briefs</p>
      <p v-if="isLoading" class="supporting-copy">Loading case briefs…</p>
      <ul v-else-if="briefs.length" class="brief-list">
        <li v-for="brief in briefs" :key="brief.id">
          <RouterLink :to="`/class/${classId}/case-briefs/${brief.id}`">
            {{ brief.caseName || 'Untitled case brief' }}
            <span v-if="brief.citation" class="citation">{{ brief.citation }}</span>
          </RouterLink>
        </li>
      </ul>
      <p v-else class="supporting-copy">No case briefs yet.</p>
      <RouterLink :to="`/class/${classId}/case-briefs/new`">Add case brief</RouterLink>
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

.danger {
  justify-self: start;
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-error);
  border-radius: 0.9rem;
  background: var(--color-surface);
  color: var(--color-error);
  cursor: pointer;
  font: inherit;
}
</style>
