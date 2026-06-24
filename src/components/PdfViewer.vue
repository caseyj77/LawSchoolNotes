<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { GlobalWorkerOptions, TextLayer, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'

GlobalWorkerOptions.workerSrc = PdfWorker

const RESIZE_DEBOUNCE_MS = 150
const MAX_SCALE = 2.5

const props = defineProps({
  data: { type: ArrayBuffer, default: null },
  filename: { type: String, default: '' },
  initialPage: { type: Number, default: 1 },
})
const emit = defineEmits(['capture'])

const canvasShellRef = ref(null)
const canvasRef = ref(null)
const textLayerRef = ref(null)
const pdfDoc = shallowRef(null)
const currentPage = ref(1)
const pageCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')

let resizeObserver = null
let resizeTimer = null

async function loadDocument(buffer) {
  pdfDoc.value?.loadingTask?.destroy()
  pdfDoc.value = null
  pageCount.value = 0
  errorMessage.value = ''

  if (!buffer) return

  isLoading.value = true
  try {
    const doc = await getDocument({ data: buffer.slice(0) }).promise
    pdfDoc.value = doc
    pageCount.value = doc.numPages
    currentPage.value = Math.min(Math.max(props.initialPage, 1), doc.numPages)
    // canvas-shell is v-show toggled by pdfDoc — wait for that DOM update to
    // flush before measuring its size, or the very first render computes a
    // fit-scale against a still-hidden (0-size) container.
    await nextTick()
    await renderPage(currentPage.value)
  } catch {
    errorMessage.value = 'Could not load this PDF.'
  } finally {
    isLoading.value = false
  }
}

async function renderPage(pageNumber) {
  if (!pdfDoc.value || !canvasRef.value || !canvasShellRef.value) return

  const page = await pdfDoc.value.getPage(pageNumber)
  const unscaled = page.getViewport({ scale: 1 })
  const availableWidth = canvasShellRef.value.clientWidth || unscaled.width
  const availableHeight = canvasShellRef.value.clientHeight || unscaled.height
  const fitScale = Math.min(availableWidth / unscaled.width, availableHeight / unscaled.height)
  const scale = Math.min(fitScale > 0 ? fitScale : 1, MAX_SCALE)

  const viewport = page.getViewport({ scale })
  const canvas = canvasRef.value
  // Canvas width/height attributes set the bitmap resolution; without
  // separately setting style.width/height in CSS pixels, the browser
  // stretches a 1:1 bitmap to fill the device's actual (higher-density)
  // pixels on any screen with devicePixelRatio > 1, rendering blurry.
  const outputScale = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * outputScale)
  canvas.height = Math.floor(viewport.height * outputScale)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`

  const context = canvas.getContext('2d')
  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
  await page.render({ canvasContext: context, transform, viewport }).promise

  const textLayerDiv = textLayerRef.value
  textLayerDiv.innerHTML = ''
  textLayerDiv.style.width = `${viewport.width}px`
  textLayerDiv.style.height = `${viewport.height}px`
  textLayerDiv.style.setProperty('--scale-factor', viewport.scale)
  // pdfjs-dist's TextLayer sizes its container via a CSS calc() that reads
  // these two vars (normally supplied by pdf.js's full PDFViewer/.pdfViewer
  // .page scaffolding, which this minimal integration doesn't use) — without
  // them the calc is invalid and the selectable spans end up mispositioned,
  // silently breaking text selection.
  textLayerDiv.style.setProperty('--total-scale-factor', viewport.scale)
  textLayerDiv.style.setProperty('--scale-round-x', '1px')
  textLayerDiv.style.setProperty('--scale-round-y', '1px')

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
    source: { filename: props.filename, page: currentPage.value },
    position: { x: event.clientX, y: event.clientY },
  })
}

watch(
  () => props.data,
  (buffer) => {
    loadDocument(buffer)
  },
)

onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      if (pdfDoc.value) renderPage(currentPage.value)
    }, RESIZE_DEBOUNCE_MS)
  })
  resizeObserver.observe(canvasShellRef.value)

  if (props.data) loadDocument(props.data)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  clearTimeout(resizeTimer)
  pdfDoc.value?.loadingTask?.destroy()
})
</script>

<template>
  <div class="pdf-viewer">
    <div v-if="pageCount" class="pager">
      <button type="button" :disabled="currentPage <= 1" @click="goToPage(-1)">Prev</button>
      <span>Page {{ currentPage }} / {{ pageCount }}</span>
      <button type="button" :disabled="currentPage >= pageCount" @click="goToPage(1)">Next</button>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="isLoading" class="status">Loading…</p>

    <div ref="canvasShellRef" v-show="pdfDoc" class="canvas-shell" @contextmenu="handleContextMenu">
      <div class="page-stack">
        <canvas ref="canvasRef"></canvas>
        <div ref="textLayerRef" class="textLayer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer {
  display: grid;
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
  color: var(--color-text);
  cursor: pointer;
  font: inherit;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.canvas-shell {
  overflow: auto;
  height: 80vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
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
