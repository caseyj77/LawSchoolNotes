<script setup>
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { GlobalWorkerOptions, TextLayer, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'

GlobalWorkerOptions.workerSrc = PdfWorker

const emit = defineEmits(['capture'])

const canvasRef = ref(null)
const textLayerRef = ref(null)
const filename = ref('')
const pdfDoc = shallowRef(null)
const currentPage = ref(1)
const pageCount = ref(0)
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
    const doc = await getDocument({ data: buffer }).promise
    pdfDoc.value = doc
    pageCount.value = doc.numPages
    currentPage.value = 1
    await renderPage(1)
  } catch {
    errorMessage.value = 'Could not load this PDF.'
  } finally {
    isLoading.value = false
  }
}

async function renderPage(pageNumber) {
  if (!pdfDoc.value || !canvasRef.value) return

  const page = await pdfDoc.value.getPage(pageNumber)
  const viewport = page.getViewport({ scale: 1.4 })
  const canvas = canvasRef.value
  canvas.width = viewport.width
  canvas.height = viewport.height

  const context = canvas.getContext('2d')
  await page.render({ canvasContext: context, viewport }).promise

  const textLayerDiv = textLayerRef.value
  textLayerDiv.innerHTML = ''
  textLayerDiv.style.width = `${viewport.width}px`
  textLayerDiv.style.height = `${viewport.height}px`
  textLayerDiv.style.setProperty('--scale-factor', viewport.scale)

  const textLayer = new TextLayer({
    textContentSource: page.streamTextContent(),
    container: textLayerDiv,
    viewport,
  })
  await textLayer.render()
}

async function goToPage(delta) {
  const next = currentPage.value + delta
  if (next < 1 || next > pageCount.value) return
  currentPage.value = next
  await renderPage(next)
}

function handleContextMenu(event) {
  const text = window.getSelection()?.toString().trim()
  if (!text) return

  event.preventDefault()
  emit('capture', {
    text,
    source: { filename: filename.value, page: currentPage.value },
    position: { x: event.clientX, y: event.clientY },
  })
}

onBeforeUnmount(() => {
  pdfDoc.value?.loadingTask?.destroy()
})
</script>

<template>
  <div class="pdf-viewer">
    <div class="toolbar">
      <input type="file" accept=".pdf" @change="handleFileChange">
      <div v-if="pageCount" class="pager">
        <button type="button" :disabled="currentPage <= 1" @click="goToPage(-1)">Prev</button>
        <span>Page {{ currentPage }} / {{ pageCount }}</span>
        <button type="button" :disabled="currentPage >= pageCount" @click="goToPage(1)">Next</button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="isLoading" class="status">Loading…</p>

    <div v-show="pdfDoc" class="canvas-shell" @contextmenu="handleContextMenu">
      <div class="page-stack">
        <canvas ref="canvasRef"></canvas>
        <div ref="textLayerRef" class="textLayer"></div>
      </div>
    </div>

    <p v-if="!pdfDoc && !isLoading && !errorMessage" class="status">
      Upload a PDF to start reading.
    </p>
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: grid;
  gap: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pager {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pager button {
  padding: 0.5rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.7rem;
  background: var(--color-surface);
  cursor: pointer;
  font: inherit;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.canvas-shell {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface);
  user-select: text;
}

.page-stack {
  position: relative;
}

.page-stack canvas {
  display: block;
}

.status,
.error {
  color: var(--color-text-secondary);
}

.error {
  color: var(--color-error);
}
</style>
