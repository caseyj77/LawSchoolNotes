<script setup>
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { convertToHtml } from 'mammoth'

const emit = defineEmits(['capture'])

const filename = ref('')
const html = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  errorMessage.value = ''
  isLoading.value = true
  filename.value = file.name

  try {
    const buffer = await file.arrayBuffer()
    const result = await convertToHtml({ arrayBuffer: buffer })
    html.value = DOMPurify.sanitize(result.value)
  } catch {
    errorMessage.value = 'Could not load this document.'
    html.value = ''
  } finally {
    isLoading.value = false
  }
}

function handleContextMenu(event) {
  const text = window.getSelection()?.toString().trim()
  if (!text) return

  event.preventDefault()
  emit('capture', {
    text,
    source: { filename: filename.value },
    position: { x: event.clientX, y: event.clientY },
  })
}
</script>

<template>
  <div class="docx-viewer">
    <div class="toolbar">
      <input type="file" accept=".docx" @change="handleFileChange">
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="isLoading" class="status">Loading…</p>

    <div v-if="html" class="document-shell" @contextmenu="handleContextMenu" v-html="html"></div>

    <p v-if="!html && !isLoading && !errorMessage" class="status">
      Upload a .docx file to start reading.
    </p>
  </div>
</template>

<style scoped>
.docx-viewer {
  display: grid;
  gap: 1rem;
}

.document-shell {
  overflow: auto;
  max-height: 70vh;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface);
  line-height: 1.6;
}

.status,
.error {
  color: var(--color-text-secondary);
}

.error {
  color: var(--color-error);
}
</style>
