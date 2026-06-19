<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const notesStore = useNotesStore()

const cls = computed(() => notesStore.getClassById(route.params.classId))
</script>

<template>
  <section v-if="cls" class="content-grid">
    <article class="panel">
      <p class="label">Outline builder</p>
      <h2>{{ cls.title }}</h2>
      <p class="supporting-copy">
        Outline editing isn't available yet — check back soon.
      </p>
      <RouterLink :to="`/class/${cls.id}`">Back to class</RouterLink>
    </article>
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
}

.panel {
  padding: 1.5rem;
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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
  margin: 1rem 0;
  line-height: 1.65;
}
</style>
