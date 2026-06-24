<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BriefSectionsForm from '@/components/BriefSectionsForm.vue'
import { downloadBriefAsWord } from '@/lib/exportBriefToWord'
import { isJsonDocEmpty, renderRichTextToHtml } from '@/lib/renderRichText'
import { caseBriefSchema } from '@/schemas/caseBriefSchema'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const router = useRouter()
const notesStore = useNotesStore()

const isLoading = ref(true)
const isSaving = ref(false)
const brief = reactive({})
const templateSections = ref([])
const errors = ref({})
const showPreview = ref(true)

onMounted(async () => {
  const sections = await notesStore.getTemplateSections()
  const existing = route.params.briefId
    ? await notesStore.fetchBriefById(route.params.briefId)
    : null

  Object.assign(brief, existing ?? (await notesStore.createBlankBrief(route.params.courseId)))
  templateSections.value = sections
  isLoading.value = false
})

const studentNotesPreview = computed(() => brief.studentNotes || 'Add any notes for yourself.')

const completedCount = computed(
  () => templateSections.value.filter((section) => !isJsonDocEmpty(brief.sections?.[section.key])).length,
)

// `brief` is a plain reactive object populated from an async load, not a
// VeeValidate-bound form, so it's validated directly against the Zod schema
// rather than through useForm's internal field state.
async function handleSave() {
  const result = caseBriefSchema.safeParse({
    caseName: brief.caseName,
    citation: brief.citation,
    studentNotes: brief.studentNotes,
  })
  if (!result.success) {
    errors.value = result.error.flatten().fieldErrors
    return
  }
  errors.value = {}

  isSaving.value = true
  try {
    const saved = await notesStore.saveCaseBrief(brief)
    router.push(`/course/${saved.courseId}`)
  } finally {
    isSaving.value = false
  }
}

function handleExport() {
  downloadBriefAsWord(brief, templateSections.value)
}
</script>

<template>
  <p v-if="isLoading" class="loading">Loading case brief…</p>

  <section v-else class="brief-builder" :class="{ 'preview-hidden': !showPreview }">
    <header class="builder-header">
      <div class="header-titles">
        <p class="eyebrow">Case brief builder</p>
        <input
          id="case-name"
          v-model.trim="brief.caseName"
          class="title-input"
          type="text"
          placeholder="Palsgraf v. Long Island Railroad Co."
        >
        <input
          id="citation"
          v-model.trim="brief.citation"
          class="citation-input"
          type="text"
          placeholder="248 N.Y. 339 (1928)"
        >
        <span v-if="errors.caseName?.[0]" class="field-error">{{ errors.caseName[0] }}</span>
        <span v-if="errors.citation?.[0]" class="field-error">{{ errors.citation[0] }}</span>
      </div>

      <div class="header-actions">
        <span class="progress-pill">{{ completedCount }}/{{ templateSections.length }} sections</span>
        <button type="button" class="ghost-button" @click="showPreview = !showPreview">
          {{ showPreview ? 'Hide preview' : 'Show preview' }}
        </button>
        <button type="button" class="ghost-button" @click="handleExport">Export to Word</button>
        <button type="button" class="save-button" :disabled="isSaving" @click="handleSave">
          {{ isSaving ? 'Saving…' : 'Save brief' }}
        </button>
      </div>
    </header>

    <div class="builder-body">
      <article class="editor-column">
        <form class="brief-form" @submit.prevent="handleSave">
          <BriefSectionsForm :brief="brief" :template-sections="templateSections" />

          <label class="notes-field">
            Student notes
            <textarea
              v-model.trim="brief.studentNotes"
              rows="3"
              placeholder="Anything else worth remembering?"
            ></textarea>
          </label>
        </form>
      </article>

      <aside v-if="showPreview" class="preview-column">
        <p class="eyebrow preview-eyebrow">Brief preview · Word document</p>
        <article class="doc-page">
          <h1 class="doc-title">{{ brief.caseName || 'Untitled case brief' }}</h1>
          <p v-if="brief.citation" class="doc-citation">{{ brief.citation }}</p>

          <section v-for="section in templateSections" :key="section.key" class="doc-section">
            <h2 class="doc-heading">{{ section.label }}</h2>
            <div
              v-if="!isJsonDocEmpty(brief.sections[section.key])"
              class="doc-body"
              v-html="renderRichTextToHtml(brief.sections[section.key])"
            ></div>
            <p v-else class="doc-placeholder">{{ section.placeholder }}</p>
          </section>

          <section class="doc-section">
            <h2 class="doc-heading">Student Notes</h2>
            <p class="doc-body" :class="{ 'doc-placeholder': !brief.studentNotes }">
              {{ studentNotesPreview }}
            </p>
          </section>
        </article>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.loading {
  margin-top: 0;
}

.brief-builder {
  display: grid;
  gap: 1.25rem;
}

/* Sticky header keeps the title, progress, and Save within reach for a long form. */
.builder-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  background: var(--color-panel-bg);
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px var(--shadow-color-light);
}

.header-titles {
  display: grid;
  gap: 0.4rem;
  flex: 1 1 22rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

.title-input {
  width: 100%;
  padding: 0.2rem 0;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font: inherit;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text);
}

.citation-input {
  width: 100%;
  padding: 0.1rem 0;
  border: none;
  border-bottom: 1px dashed transparent;
  background: none;
  font: inherit;
  color: var(--color-text-secondary);
}

.title-input:focus,
.citation-input:focus {
  outline: none;
  border-bottom-color: var(--color-accent);
}

.title-input::placeholder,
.citation-input::placeholder {
  color: var(--color-disabled);
  font-weight: 400;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.progress-pill {
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: var(--color-bg-alt);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
}

.ghost-button {
  padding: 0.65rem 1.1rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.ghost-button:hover {
  background: var(--color-bg-alt);
}

.save-button {
  padding: 0.65rem 1.5rem;
  border: none;
  border-radius: 999px;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.field-error {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}

.builder-body {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: start;
}

.preview-hidden .builder-body {
  grid-template-columns: minmax(0, 1fr);
}

.editor-column {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: var(--color-panel-bg);
  box-shadow: 0 18px 45px var(--shadow-color-light);
}

.brief-form {
  display: grid;
  gap: 1rem;
}

.notes-field {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

textarea {
  width: 100%;
  padding: 0.85rem 0.95rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
  resize: vertical;
}

.preview-column {
  position: sticky;
  top: 7.5rem;
  display: grid;
  gap: 0.5rem;
}

.preview-eyebrow {
  margin: 0;
}

/* The preview mirrors the exported Word document: a white page with a title,
   citation, and H2 section headings. */
.doc-page {
  padding: 2.5rem 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: #fff;
  box-shadow: 0 18px 45px var(--shadow-color);
  color: var(--space-indigo);
  font-family: 'Calibri', 'Segoe UI', sans-serif;
  line-height: 1.5;
}

.doc-title {
  margin: 0 0 0.2rem;
  font-size: 1.7rem;
  font-weight: 700;
}

.doc-citation {
  margin: 0 0 1.5rem;
  color: var(--color-text-secondary);
}

.doc-section + .doc-section {
  margin-top: 1.1rem;
}

.doc-heading {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 700;
}

.doc-body {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.doc-placeholder {
  margin: 0;
  color: var(--color-disabled);
  font-style: italic;
  white-space: normal;
}

.doc-body :deep(p) {
  margin: 0 0 0.5rem;
}

.doc-body :deep(p:last-child) {
  margin-bottom: 0;
}

.doc-body :deep(blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.85rem;
  border-left: 3px solid var(--color-border);
  color: var(--vintage-grape);
}

@media (max-width: 860px) {
  .builder-body {
    grid-template-columns: minmax(0, 1fr);
  }

  .preview-column {
    position: static;
  }
}
</style>
