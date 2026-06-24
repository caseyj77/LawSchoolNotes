<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { GlobalWorkerOptions, TextLayer, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import PdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import 'pdfjs-dist/legacy/web/pdf_viewer.css'

import { annotationColorRgba } from '@/lib/annotationColors'

GlobalWorkerOptions.workerSrc = PdfWorker

const RESIZE_DEBOUNCE_MS = 150
const MIN_SCALE = 0.5
const MAX_SCALE = 4
const ZOOM_STEP = 1.2

function clampScale(value) {
  return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE)
}

const props = defineProps({
  data: { type: ArrayBuffer, default: null },
  filename: { type: String, default: '' },
  initialPage: { type: Number, default: 1 },
  // Annotations for the open document; PDF highlights are rendered as overlay
  // divs positioned from their normalized rects on every (re)render.
  annotations: { type: Array, default: () => [] },
})
const emit = defineEmits(['capture'])

const canvasShellRef = ref(null)
const canvasRef = ref(null)
const highlightLayerRef = ref(null)
const textLayerRef = ref(null)
const pdfDoc = shallowRef(null)
const currentPage = ref(1)
const pageCount = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
// null = auto fit-to-width; a number = an explicit user-chosen scale.
const zoomScale = ref(null)
// The actual scale used for the most recent render, so the zoom % readout and
// the zoom-in/out steps work off what's really on screen (incl. auto-fit).
const renderedScale = ref(1)
// Rendered page size (CSS px) of the most recent render, used to lay out
// highlight overlays without re-rendering the canvas.
const renderedSize = ref({ width: 0, height: 0 })

const zoomPercent = computed(() => `${Math.round(renderedScale.value * 100)}%`)

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
    const doc = await getDocument({
      data: buffer.slice(0),
      // Without these, pdf.js can't substitute non-embedded standard fonts
      // or decode CID character maps used by many real-world PDFs (common
      // in exports from legal databases) — text still *renders* via canvas
      // fallback glyphs, but the text-layer's glyph metrics silently don't
      // match, leaving drag-to-select non-functional on affected documents.
      standardFontDataUrl: '/standard_fonts/',
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    }).promise
    pdfDoc.value = doc
    pageCount.value = doc.numPages
    currentPage.value = Math.min(Math.max(props.initialPage, 1), doc.numPages)
    zoomScale.value = null // each newly opened document starts at fit-to-width

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
  // Default to fitting the page to the available *width* (not width AND height):
  // fitting to height as well shrank portrait pages to a small column. The
  // canvas-shell scrolls vertically, so width-fit fills the pane and stays
  // readable. An explicit user zoom overrides the auto fit.
  const availableWidth = canvasShellRef.value.clientWidth || unscaled.width
  const fitWidthScale = availableWidth / unscaled.width || 1
  const scale = clampScale(zoomScale.value ?? fitWidthScale)
  renderedScale.value = scale

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

  // Remember the page's rendered CSS size so highlight overlays can be
  // re-laid-out (on annotation changes) without re-rendering the canvas.
  renderedSize.value = { width: viewport.width, height: viewport.height }
  renderHighlights()
}

const clamp01 = (value) => Math.min(Math.max(value, 0), 1)

// Convert the current selection into rects expressed as fractions of the
// rendered page, so they re-anchor correctly at any zoom. Coordinates are taken
// relative to the canvas (the page origin) and divided by its rendered size.
function computeSelectionRects(selection) {
  const canvas = canvasRef.value
  if (!canvas || !selection || selection.rangeCount === 0) return []
  const base = canvas.getBoundingClientRect()
  if (!base.width || !base.height) return []

  const rects = []
  for (let i = 0; i < selection.rangeCount; i += 1) {
    for (const r of selection.getRangeAt(i).getClientRects()) {
      if (!r.width || !r.height) continue
      rects.push({
        x: clamp01((r.left - base.left) / base.width),
        y: clamp01((r.top - base.top) / base.height),
        w: clamp01(r.width / base.width),
        h: clamp01(r.height / base.height),
      })
    }
  }
  return rects
}

// Paint overlay divs for this page's highlights. Child divs are created
// imperatively (not in the Vue template), so — like pdf.js's text-layer spans —
// scoped CSS can't reach them; their box styles are set inline instead.
function renderHighlights() {
  const layer = highlightLayerRef.value
  if (!layer) return

  const { width, height } = renderedSize.value
  layer.style.width = `${width}px`
  layer.style.height = `${height}px`
  layer.innerHTML = ''
  if (!width || !height) return

  const pageZeroIndex = currentPage.value - 1
  for (const annotation of props.annotations) {
    if (annotation.sourceType !== 'pdf' || annotation.pageIndex !== pageZeroIndex) continue
    for (const rect of annotation.anchor?.rects ?? []) {
      const div = document.createElement('div')
      div.style.position = 'absolute'
      div.style.borderRadius = '2px'
      div.style.pointerEvents = 'none'
      div.style.left = `${rect.x * width}px`
      div.style.top = `${rect.y * height}px`
      div.style.width = `${rect.w * width}px`
      div.style.height = `${rect.h * height}px`
      div.style.background = annotationColorRgba(annotation.color)
      layer.appendChild(div)
    }
  }
}

async function goToPage(delta) {
  const next = currentPage.value + delta
  if (next < 1 || next > pageCount.value) return
  currentPage.value = next
  await renderPage(next)
}

async function applyZoom(scale) {
  const clamped = clampScale(scale)
  // Already at the rail and asked to push further — nothing to do.
  if (clamped === zoomScale.value) return
  zoomScale.value = clamped
  await renderPage(currentPage.value)
}

// Step relative to what's actually on screen, so the first zoom-in/out from
// auto fit-to-width moves from the visible size rather than a fixed 100%.
function zoomIn() {
  return applyZoom(renderedScale.value * ZOOM_STEP)
}

function zoomOut() {
  return applyZoom(renderedScale.value / ZOOM_STEP)
}

async function resetZoom() {
  if (zoomScale.value === null) return
  zoomScale.value = null
  await renderPage(currentPage.value)
}

function handleContextMenu(event) {
  const selection = window.getSelection()
  const text = selection?.toString().trim()
  if (!text) return

  event.preventDefault()
  const rects = computeSelectionRects(selection)
  emit('capture', {
    text,
    source: { filename: props.filename, page: currentPage.value },
    // Anchor data for creating a highlight (null if geometry couldn't be read).
    anchor: rects.length ? { rects } : null,
    pageIndex: currentPage.value - 1,
    position: { x: event.clientX, y: event.clientY },
  })
}

watch(
  () => props.data,
  (buffer) => {
    loadDocument(buffer)
  },
)

// Repaint overlays when the document's annotations change (e.g. a new highlight
// was created) without re-rendering the canvas.
watch(
  () => props.annotations,
  () => {
    if (pdfDoc.value) renderHighlights()
  },
  { deep: true },
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

      <span class="pager-spacer"></span>

      <div class="zoom-controls">
        <button
          type="button"
          aria-label="Zoom out"
          :disabled="renderedScale <= MIN_SCALE"
          @click="zoomOut"
        >
          −
        </button>
        <span class="zoom-readout">{{ zoomPercent }}</span>
        <button
          type="button"
          aria-label="Zoom in"
          :disabled="renderedScale >= MAX_SCALE"
          @click="zoomIn"
        >
          +
        </button>
        <button type="button" :disabled="zoomScale === null" @click="resetZoom">Fit width</button>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-else-if="isLoading" class="status">Loading…</p>

    <div ref="canvasShellRef" v-show="pdfDoc" class="canvas-shell" @contextmenu="handleContextMenu">
      <div class="page-stack">
        <canvas ref="canvasRef"></canvas>
        <div ref="highlightLayerRef" class="highlight-layer"></div>
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
  flex-wrap: wrap;
}

.pager-spacer {
  flex: 1 1 auto;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-readout {
  min-width: 3.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-secondary);
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

/* Sits above the canvas but below the (transparent) text layer, so highlights
   tint the rendered glyphs while text stays selectable. Non-interactive in
   Phase 1 — clicking a highlight comes later. */
.highlight-layer {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  pointer-events: none;
}

.status,
.error {
  color: var(--color-text-secondary);
}

.error {
  color: var(--color-error);
}
</style>

<style>
/* Unscoped: pdf.js's TextLayer inserts <span> elements directly at
   runtime (not via Vue's template), so Vue's scoped-style data-v
   attribute rewriting can never match them — a scoped rule here would
   silently never apply. pdf_viewer.css sets `.textLayer ::selection`
   to transparent by design (its full viewer substitutes a custom
   highlight layer we don't use), so restore a visible highlight,
   matching that selector's specificity via the extra .pdf-viewer
   ancestor class so it reliably wins regardless of CSS load order. */
.pdf-viewer .textLayer ::selection {
  background: rgba(0, 100, 255, 0.35);
}

.pdf-viewer .textLayer ::-moz-selection {
  background: rgba(0, 100, 255, 0.35);
}
</style>
