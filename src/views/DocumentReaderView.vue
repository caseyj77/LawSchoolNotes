<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import BriefSectionsForm from '@/components/BriefSectionsForm.vue'
import CaptureMenu from '@/components/CaptureMenu.vue'
import DocxViewer from '@/components/DocxViewer.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import SectionEditor from '@/components/SectionEditor.vue'
import { appendExcerpt } from '@/lib/excerptHtml'
import { useActiveBriefStore } from '@/stores/activeBriefStore'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const notesStore = useNotesStore()
const activeBriefStore = useActiveBriefStore()

const classId = computed(() => route.params.classId)
const cls = computed(() => notesStore.getClassById(classId.value))
const briefs = computed(() => notesStore.getBriefsForClass(classId.value))

const outlineHtml = computed({
  get: () => cls.value?.outline ?? '',
  set: (value) => notesStore.updateOutline(classId.value, value),
})

const isLoading = ref(true)
const templateSections = ref([])
const activeBriefId = ref(null)
const activeBrief = computed(() =>
  activeBriefId.value ? notesStore.getBriefById(activeBriefId.value) : null,
)

const documentType = ref('pdf')
const briefSectionsFormRef = ref(null)
const outlineEditorRef = ref(null)

const isCreatingBrief = ref(false)
const newBriefName = ref('')

const captureMissingBriefMessage = ref('')
const pendingCapture = ref(null)
const menuPosition = ref(null)

onMounted(async () => {
  templateSections.value = await notesStore.getTemplateSections()
  await notesStore.loadBriefsForClass(classId.value)

  const lastActiveId = activeBriefStore.getActiveBriefForClass(classId.value)
  const stillExists = lastActiveId && notesStore.getBriefById(lastActiveId)
  activeBriefId.value = stillExists ? lastActiveId : briefs.value[0]?.id ?? null
  isLoading.value = false
})

function handleSelectChange(event) {
  const value = event.target.value
  if (value === '__new__') {
    isCreatingBrief.value = true
    return
  }
  activeBriefId.value = value
  activeBriefStore.setActiveBriefForClass(classId.value, value)
}

async function handleCreateBrief() {
  const caseName = newBriefName.value.trim()
  if (!caseName) return

  const created = await notesStore.createAndSaveBrief({ classId: classId.value, caseName })
  activeBriefId.value = created.id
  newBriefName.value = ''
  isCreatingBrief.value = false
}

function handleCapture({ text, source, position }) {
  captureMissingBriefMessage.value = ''
  pendingCapture.value = { text, source }
  menuPosition.value = position
}

function closeMenu() {
  pendingCapture.value = null
  menuPosition.value = null
}

function handleSelectSection(sectionKey) {
  if (!activeBriefId.value) {
    captureMissingBriefMessage.value = 'Select or create a case brief first.'
    closeMenu()
    return
  }
  const editor = briefSectionsFormRef.value?.getSectionEditor(sectionKey)
  if (editor && pendingCapture.value) {
    appendExcerpt(editor, pendingCapture.value.text, pendingCapture.value.source)
  }
  closeMenu()
}

function handleSelectOutline() {
  const editor = outlineEditorRef.value?.editor
  if (editor && pendingCapture.value) {
    appendExcerpt(editor, pendingCapture.value.text, pendingCapture.value.source)
  }
  closeMenu()
}
</script>

<template>
  <section v-if="isLoading" class="content-grid">
    <p>Loading document reader…</p>
  </section>

  <section v-else-if="cls" class="content-grid">
    <header class="reader-header">
      <p class="label">Document reader</p>
      <h2>{{ cls.title }}</h2>
      <RouterLink :to="`/class/${classId}`" class="back-link">← Back to class</RouterLink>
    </header>

    <div class="reader-layout">
      <article class="panel document-pane">
        <div class="document-toggle">
          <button
            type="button"
            :class="{ active: documentType === 'pdf' }"
            @click="documentType = 'pdf'"
          >
            PDF
          </button>
          <button
            type="button"
            :class="{ active: documentType === 'docx' }"
            @click="documentType = 'docx'"
          >
            Word document
          </button>
        </div>

        <PdfViewer v-if="documentType === 'pdf'" @capture="handleCapture" />
        <DocxViewer v-else @capture="handleCapture" />
      </article>

      <div class="right-column">
        <article class="panel outline-pane">
          <p class="label">Outline</p>
          <SectionEditor
            ref="outlineEditorRef"
            v-model="outlineHtml"
            label="Outline"
            placeholder="Capture outline notes here…"
          />
        </article>

        <article class="panel brief-pane">
          <p class="label">Active case brief</p>

          <select :value="activeBriefId" class="brief-select" @change="handleSelectChange">
            <option :value="null" disabled>Select a brief</option>
            <option v-for="brief in briefs" :key="brief.id" :value="brief.id">
              {{ brief.caseName || 'Untitled case brief' }}
            </option>
            <option value="__new__">+ New Case Brief</option>
          </select>

          <form v-if="isCreatingBrief" class="new-brief-form" @submit.prevent="handleCreateBrief">
            <input v-model.trim="newBriefName" type="text" placeholder="Case name" required>
            <button type="submit">Create</button>
          </form>

          <p v-if="captureMissingBriefMessage" class="warning">{{ captureMissingBriefMessage }}</p>

          <BriefSectionsForm
            v-if="activeBrief"
            ref="briefSectionsFormRef"
            :brief="activeBrief"
            :template-sections="templateSections"
          />
          <p v-else class="supporting-copy">No brief selected for this class yet.</p>
        </article>
      </div>
    </div>

    <CaptureMenu
      v-if="pendingCapture"
      :position="menuPosition"
      :template-sections="templateSections"
      @select-section="handleSelectSection"
      @select-outline="handleSelectOutline"
      @close="closeMenu"
    />
  </section>

  <section v-else class="content-grid">
    <article class="panel">
      <p>Class not found.</p>
      <RouterLink to="/">← All classes</RouterLink>
    </article>
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
  gap: 1.5rem;
}

.reader-header {
  display: grid;
  gap: 0.5rem;
}

.label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #92400e;
}

h2 {
  margin: 0;
  font-size: 1.8rem;
}

.back-link {
  color: #1f2937;
  font-weight: 600;
  text-decoration: none;
}

.reader-layout {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 2fr 1fr;
}

@media (max-width: 900px) {
  .reader-layout {
    grid-template-columns: 1fr;
  }
}

.panel {
  padding: 1.5rem;
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

.document-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.document-toggle button {
  padding: 0.5rem 0.9rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.7rem;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

.document-toggle button.active {
  background: #1f2937;
  border-color: #1f2937;
  color: #fff;
}

.right-column {
  display: grid;
  gap: 1.5rem;
  align-content: start;
}

.brief-pane {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.brief-select {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.9rem;
  font: inherit;
  background: #fffdfb;
}

.new-brief-form {
  display: flex;
  gap: 0.5rem;
}

.new-brief-form input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid #d6d3d1;
  border-radius: 0.7rem;
  font: inherit;
}

.new-brief-form button {
  padding: 0.6rem 1rem;
  border: 1px solid #1f2937;
  border-radius: 0.7rem;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  font: inherit;
}

.warning {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.7rem;
  background: #fef2f2;
  color: #b91c1c;
}

.supporting-copy {
  color: #6b7280;
}
</style>
