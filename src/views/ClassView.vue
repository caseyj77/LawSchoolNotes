<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const notesStore = useNotesStore()

const classId = computed(() => route.params.classId)
const cls = computed(() => notesStore.getClassById(classId.value))
const briefs = computed(() => notesStore.getBriefsForClass(classId.value))
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
      </div>
    </article>

    <article class="panel">
      <p class="label">Outline</p>
      <p class="supporting-copy">No outline yet.</p>
      <RouterLink :to="`/class/${classId}/outline`">Open outline builder</RouterLink>
    </article>

    <article class="panel">
      <p class="label">Case briefs</p>
      <ul v-if="briefs.length" class="brief-list">
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
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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
  color: #92400e;
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
  background: #f8fafc;
  text-decoration: none;
}

.citation {
  color: #6b7280;
}
</style>
