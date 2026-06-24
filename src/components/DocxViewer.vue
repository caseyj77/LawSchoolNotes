<script setup>
import { ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { convertToHtml } from 'mammoth'

const props = defineProps({
  data: { type: ArrayBuffer, default: null },
  filename: { type: String, default: '' },
})
const emit = defineEmits(['capture'])

const html = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function loadDocument(buffer) {
  html.value = ''
  errorMessage.value = ''

  if (!buffer) return

  isLoading.value = true
  try {
    const result = await convertToHtml({ arrayBuffer: buffer.slice(0) })
    html.value = DOMPurify.sanitize(result.value)
  } catch {
    errorMessage.value = 'Could not load this document.'
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
    source: { filename: props.filename },
    position: { x: event.clientX, y: event.clientY },
  })
}

watch(
  () => props.data,
  (buffer) => {
    loadDocument(buffer)
  },
  { immediate: true },
)
</script>

<template>
  <div class="docx-viewer">
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="isLoading" class="status">Loading…</p>

    <div v-if="html" class="document-shell" @contextmenu="handleContextMenu" v-html="html"></div>
  </div>
</template>

<style scoped>
.docx-viewer {
  display: grid;
  gap: 1rem;
}

.document-shell {
  overflow: auto;
  height: 80vh;
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
