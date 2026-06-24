<script setup>
import { toTypedSchema } from '@vee-validate/zod'
import { computed, onMounted, ref } from 'vue'
import { useForm } from 'vee-validate'
import { RouterLink, useRoute } from 'vue-router'

import BriefSectionsForm from '@/components/BriefSectionsForm.vue'
import CaptureMenu from '@/components/CaptureMenu.vue'
import DocxViewer from '@/components/DocxViewer.vue'
import PdfViewer from '@/components/PdfViewer.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { appendExcerpt } from '@/lib/excerptHtml'
import { newBriefCaptureSchema } from '@/schemas/newBriefCaptureSchema'
import { useDocumentsStore } from '@/stores/documentsStore'
import { useNotesStore } from '@/stores/notesStore'

const route = useRoute()
const notesStore = useNotesStore()
const documentsStore = useDocumentsStore()

const courseId = computed(() => route.params.courseId)
const course = computed(() => notesStore.getCourseById(courseId.value))
const briefs = computed(() => notesStore.getBriefsForCourse(courseId.value))

const outlineContent = computed({
  get: () => course.value?.outline ?? { type: 'doc', content: [] },
  set: (value) => notesStore.updateOutline(courseId.value, value),
})

const isLoading = ref(true)
const templateSections = ref([])
const activeBriefId = ref(null)
const activeBrief = computed(() =>
  activeBriefId.value ? notesStore.getBriefById(activeBriefId.value) : null,
)

const briefSectionsFormRef = ref(null)
const outlineEditorRef = ref(null)

const activeDocumentId = ref(null)
const activeDocumentData = ref(null)
const activeDocument = computed(() =>
  documentsStore.documents.find((doc) => doc.id === activeDocumentId.value) ?? null,
)
const initialPage = ref(1)
const isUploading = ref(false)
const uploadError = ref('')

const isCreatingBrief = ref(false)
const {
  defineField: defineNewBriefField,
  errors: newBriefErrors,
  handleSubmit: handleNewBriefSubmit,
  resetForm: resetNewBriefForm,
} = useForm({ validationSchema: toTypedSchema(newBriefCaptureSchema) })
const [newBriefName] = defineNewBriefField('caseName')

const captureMissingBriefMessage = ref('')
const pendingCapture = ref(null)
const menuPosition = ref(null)

async function openDocument(doc, page = 1) {
  activeDocumentId.value = doc.id
  initialPage.value = page
  activeDocumentData.value = await documentsStore.downloadDocument(doc.storagePath)
}

async function handleUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  isUploading.value = true
  uploadError.value = ''
  try {
    const created = await documentsStore.uploadDocument(courseId.value, file)
    await openDocument(created)
  } catch (e) {
    uploadError.value = e.message || 'Could not upload this file.'
  } finally {
    isUploading.value = false
    event.target.value = ''
  }
}

async function handleDeleteDocument(id) {
  await documentsStore.deleteDocument(id)
  if (activeDocumentId.value === id) {
    activeDocumentId.value = null
    activeDocumentData.value = null
  }
}

onMounted(async () => {
  // A direct/bookmarked/shared link (e.g. the "back to source" quote link)
  // can land here before notesStore.courses has ever been fetched — that
  // only normally happens via CourseOutlinesView's own onMounted, so a cold
  // load straight into this route would otherwise show "Course not found."
  if (!notesStore.courses.length) await notesStore.fetchCourses()

  templateSections.value = await notesStore.getTemplateSections()
  await notesStore.loadBriefsForCourse(courseId.value)
  await documentsStore.fetchDocuments(courseId.value)

  const lastActiveId = notesStore.getActiveBriefForCourse(courseId.value)
  const stillExists = lastActiveId && notesStore.getBriefById(lastActiveId)
  activeBriefId.value = stillExists ? lastActiveId : briefs.value[0]?.id ?? null

  const queryDocId = route.query.docId
  if (queryDocId) {
    const targetDoc = documentsStore.documents.find((doc) => doc.id === queryDocId)
    if (targetDoc) await openDocument(targetDoc, route.query.page ? Number(route.query.page) : 1)
  }

  isLoading.value = false
})

async function handleSelectChange(event) {
  const value = event.target.value
  if (value === '__new__') {
    isCreatingBrief.value = true
    return
  }
  activeBriefId.value = value
  await notesStore.setActiveBriefForCourse(courseId.value, value)
}

const handleCreateBrief = handleNewBriefSubmit(async (values) => {
  const created = await notesStore.createAndSaveBrief({ courseId: courseId.value, caseName: values.caseName })
  activeBriefId.value = created.id
  resetNewBriefForm()
  isCreatingBrief.value = false
})

function handleCapture({ text, source, position }) {
  captureMissingBriefMessage.value = ''
  const enrichedSource = activeDocument.value
    ? { ...source, courseId: courseId.value, documentId: activeDocument.value.id }
    : source
  pendingCapture.value = { text, source: enrichedSource }
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

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <section v-if="isLoading" class="content-grid">
    <p>Loading document reader…</p>
  </section>

  <section v-else-if="course" class="content-grid">
    <header class="reader-header">
      <p class="label">Document reader</p>
      <h2>{{ course.title }}</h2>
      <RouterLink :to="`/course/${courseId}`" class="back-link">← Back to course</RouterLink>
    </header>

    <div class="reader-layout">
      <article class="panel document-pane">
        <div class="documents-header">
          <p class="label">Documents</p>
          <label class="upload-button">
            {{ isUploading ? 'Uploading…' : '+ Upload document' }}
            <input type="file" accept=".pdf,.docx" :disabled="isUploading" @change="handleUpload">
          </label>
        </div>
        <p v-if="uploadError" class="field-error">{{ uploadError }}</p>

        <ul v-if="documentsStore.documents.length" class="document-list">
          <li
            v-for="doc in documentsStore.documents"
            :key="doc.id"
            :class="{ active: doc.id === activeDocumentId }"
          >
            <button type="button" class="document-item" @click="openDocument(doc)">
              <span class="document-name">{{ doc.filename }}</span>
              <span class="document-date">{{ formatDate(doc.createdAt) }}</span>
            </button>
            <button
              type="button"
              class="document-delete"
              aria-label="Delete document"
              @click="handleDeleteDocument(doc.id)"
            >
              ×
            </button>
          </li>
        </ul>
        <p v-else class="supporting-copy">No documents uploaded yet.</p>

        <PdfViewer
          v-if="activeDocument?.fileType === 'pdf'"
          :data="activeDocumentData"
          :filename="activeDocument.filename"
          :initial-page="initialPage"
          @capture="handleCapture"
        />
        <DocxViewer
          v-else-if="activeDocument?.fileType === 'docx'"
          :data="activeDocumentData"
          :filename="activeDocument.filename"
          @capture="handleCapture"
        />
        <p v-else class="supporting-copy">Upload a document or pick one above to start reading.</p>
      </article>

      <div class="right-column">
        <article class="panel outline-pane">
          <p class="label">Outline</p>
          <RichTextEditor
            ref="outlineEditorRef"
            v-model="outlineContent"
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
            <input v-model.trim="newBriefName" type="text" placeholder="Case name">
            <button type="submit">Create</button>
            <span v-if="newBriefErrors.caseName" class="field-error">{{ newBriefErrors.caseName }}</span>
          </form>

          <p v-if="captureMissingBriefMessage" class="warning">{{ captureMissingBriefMessage }}</p>

          <BriefSectionsForm
            v-if="activeBrief"
            ref="briefSectionsFormRef"
            :brief="activeBrief"
            :template-sections="templateSections"
          />
          <p v-else class="supporting-copy">No brief selected for this course yet.</p>
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
      <p>Course not found.</p>
      <RouterLink :to="{ name: 'course-outlines' }">← All courses</RouterLink>
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
  color: var(--color-accent);
}

h2 {
  margin: 0;
  font-size: 1.8rem;
}

.back-link {
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
}

.reader-layout {
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

.document-pane {
  display: grid;
  gap: 1rem;
}

.documents-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.upload-button {
  position: relative;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--color-active-border);
  border-radius: 999px;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.upload-button input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.document-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.document-list li {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.7rem;
  background: var(--color-surface);
  overflow: hidden;
}

.document-list li.active {
  border-color: var(--color-active-border);
  background: var(--color-bg-alt);
}

.document-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: var(--color-text);
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.document-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.document-date {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
}

.document-delete {
  align-self: stretch;
  padding: 0 0.6rem;
  border: none;
  border-left: 1px solid var(--color-border-strong);
  background: none;
  color: var(--color-disabled);
  font-size: 1rem;
  cursor: pointer;
}

.document-delete:hover {
  color: var(--color-error);
}

.right-column {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr 1fr;
  align-content: start;
}

@media (max-width: 900px) {
  .right-column {
    grid-template-columns: 1fr;
  }
}

.brief-pane {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.brief-select {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
}

.new-brief-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.new-brief-form .field-error {
  flex-basis: 100%;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}

.new-brief-form input {
  flex: 1;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.7rem;
  font: inherit;
}

.new-brief-form button {
  padding: 0.6rem 1rem;
  border: 1px solid var(--color-active-border);
  border-radius: 0.7rem;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  cursor: pointer;
  font: inherit;
}

.field-error {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-error);
}

.warning {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.7rem;
  background: var(--color-error-bg);
  color: var(--color-error);
}

.supporting-copy {
  color: var(--color-text-secondary);
}
</style>
