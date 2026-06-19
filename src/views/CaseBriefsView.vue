<script setup>
import { computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BriefSectionsForm from '@/components/BriefSectionsForm.vue'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const existing = route.params.briefId
  ? notesStore.getBriefById(route.params.briefId)
  : null

const brief = reactive(
  existing ? { ...existing } : notesStore.createBlankBrief(route.params.classId),
)

const richSections = [
  ['Facts', 'facts', 'Summarize the legally significant facts.'],
  ['Issue', 'issue', 'Frame the question the court answered.'],
  ['Rule', 'rule', 'State the governing rule or legal standard.'],
  ['Analysis', 'analysis', 'Capture how the court applied the rule.'],
  ['Conclusion', 'conclusion', 'Note the disposition or takeaway.'],
]

const studentNotesPreview = computed(() => brief.studentNotes || 'Add any notes for yourself.')

function handleSave() {
  notesStore.saveCaseBrief(brief)
  router.push(`/class/${brief.classId}`)
}
</script>

<template>
  <section class="brief-layout">
    <article class="panel">
      <p class="label">Case brief builder</p>
      <h2>Create a reusable brief.</h2>
      <p class="supporting-copy">
        Draft each section once, then review the completed brief beside your notes.
      </p>

      <form class="brief-form">
        <label>
          Case name
          <input
            id="case-name"
            v-model.trim="brief.caseName"
            type="text"
            placeholder="Palsgraf v. Long Island Railroad Co."
          >
        </label>

        <label>
          Citation
          <input
            id="citation"
            v-model.trim="brief.citation"
            type="text"
            placeholder="248 N.Y. 339 (1928)"
          >
        </label>

        <BriefSectionsForm :brief="brief" />

        <label>
          Student notes
          <textarea
            v-model.trim="brief.studentNotes"
            rows="3"
            placeholder="Anything else worth remembering?"
          ></textarea>
        </label>
      </form>

      <button type="button" class="save-button" @click="handleSave">Save brief</button>
    </article>

    <article class="panel preview">
      <p class="label">Brief preview</p>
      <h2>{{ brief.caseName || 'Untitled case brief' }}</h2>
      <p v-if="brief.citation" class="citation">{{ brief.citation }}</p>

      <dl>
        <div v-for="[title, key, placeholder] in richSections" :key="key" class="preview-section">
          <dt>{{ title }}</dt>
          <dd v-if="brief[key]" v-html="brief[key]"></dd>
          <dd v-else class="placeholder">{{ placeholder }}</dd>
        </div>
        <div class="preview-section">
          <dt>Student Notes</dt>
          <dd>{{ studentNotesPreview }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<style scoped>
.brief-layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
p,
dl {
  margin-top: 0;
}

.supporting-copy {
  line-height: 1.65;
}

.brief-form {
  display: grid;
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.9rem;
  font: inherit;
  background: #fffdfb;
}

textarea {
  resize: vertical;
}

.save-button {
  width: fit-content;
  margin-top: 1rem;
  padding: 0.85rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.preview .citation {
  margin-bottom: 1rem;
  color: #6b7280;
}

.preview dl {
  display: grid;
  gap: 1rem;
  margin-bottom: 0;
}

.preview-section {
  padding: 1rem;
  border-radius: 1rem;
  background: #f8fafc;
}

dt {
  margin-bottom: 0.4rem;
  font-weight: 700;
}

dd {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

dd.placeholder {
  color: #a8a29e;
  white-space: normal;
}

dd :deep(p) {
  margin: 0 0 0.5rem;
}

dd :deep(p:last-child) {
  margin-bottom: 0;
}

dd :deep(blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.85rem;
  border-left: 3px solid #e7e5e4;
  color: #57534e;
}
</style>
