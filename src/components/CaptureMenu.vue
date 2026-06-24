<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  position: { type: Object, required: true },
  templateSections: { type: Array, required: true },
  // Briefs for the current course, so the user can choose which one to add to.
  briefs: { type: Array, default: () => [] },
  // Whether the current selection carries anchor geometry (PDF) so it can be
  // turned into a persisted highlight.
  canHighlight: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-highlight',
  'select-brief-section',
  'create-brief-section',
  'select-outline',
  'close',
])

// One step visible at a time so the "which brief -> which section" flow is
// unambiguous (the old nested-accordion made the section step easy to miss).
const step = ref('root') // 'root' | 'briefs' | 'newBrief' | 'sections'
const targetBriefId = ref(null)
const targetBriefName = ref('')
const isNewBrief = ref(false)
const newBriefName = ref('')
const nameInput = ref(null)

function briefLabel(brief) {
  return brief.caseName || 'Untitled case brief'
}

function openBriefSections(brief) {
  isNewBrief.value = false
  targetBriefId.value = brief.id
  targetBriefName.value = briefLabel(brief)
  step.value = 'sections'
}

function startNewBrief() {
  isNewBrief.value = true
  newBriefName.value = ''
  step.value = 'newBrief'
  nextTick(() => nameInput.value?.focus())
}

function proceedNewBrief() {
  if (!newBriefName.value.trim()) return
  targetBriefName.value = newBriefName.value.trim()
  step.value = 'sections'
}

function chooseSection(sectionKey) {
  if (isNewBrief.value) {
    emit('create-brief-section', { caseName: newBriefName.value.trim(), sectionKey })
  } else {
    emit('select-brief-section', { briefId: targetBriefId.value, sectionKey })
  }
}
</script>

<template>
  <div
    class="capture-menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @contextmenu.prevent
  >
    <template v-if="step === 'root'">
      <button
        v-if="props.canHighlight"
        type="button"
        class="menu-item"
        @click="emit('select-highlight')"
      >
        Highlight
      </button>
      <button type="button" class="menu-item" @click="step = 'briefs'">Add to Case Brief ›</button>
      <button type="button" class="menu-item" @click="emit('select-outline')">Add to Outline</button>
      <button type="button" class="menu-item close" @click="emit('close')">Cancel</button>
    </template>

    <template v-else-if="step === 'briefs'">
      <button type="button" class="menu-back" @click="step = 'root'">‹ Back</button>
      <p class="menu-heading">Add to which brief?</p>
      <button
        v-for="brief in props.briefs"
        :key="brief.id"
        type="button"
        class="menu-item brief-row"
        @click="openBriefSections(brief)"
      >
        {{ briefLabel(brief) }} ›
      </button>
      <button type="button" class="menu-item new-brief" @click="startNewBrief">
        + New case brief
      </button>
    </template>

    <template v-else-if="step === 'newBrief'">
      <button type="button" class="menu-back" @click="step = 'briefs'">‹ Back</button>
      <p class="menu-heading">New case brief</p>
      <input
        ref="nameInput"
        v-model="newBriefName"
        type="text"
        placeholder="Case name"
        class="new-brief-input"
        @keyup.enter="proceedNewBrief"
      >
      <button
        type="button"
        class="menu-item new-brief-next"
        :disabled="!newBriefName.trim()"
        @click="proceedNewBrief"
      >
        Next: choose section ›
      </button>
    </template>

    <template v-else-if="step === 'sections'">
      <button type="button" class="menu-back" @click="step = isNewBrief ? 'newBrief' : 'briefs'">
        ‹ Back
      </button>
      <p class="menu-heading">Add to: {{ targetBriefName }}</p>
      <button
        v-for="section in props.templateSections"
        :key="section.key"
        type="button"
        class="menu-item section-row"
        @click="chooseSection(section.key)"
      >
        {{ section.label }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.capture-menu {
  position: fixed;
  z-index: 50;
  display: grid;
  gap: 0.1rem;
  min-width: 13rem;
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 0.9rem;
  background: var(--color-surface);
  box-shadow: 0 18px 45px var(--shadow-color-dark);
}

.menu-item {
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 0.6rem;
  background: none;
  color: var(--color-text);
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.menu-item:hover:not(:disabled) {
  background: var(--color-bg-alt);
}

.menu-item:disabled {
  color: var(--color-disabled);
  cursor: not-allowed;
}

.menu-item.close {
  color: var(--color-error);
}

.brief-row,
.section-row {
  font-weight: 600;
}

.new-brief {
  color: var(--color-accent);
}

.menu-back {
  padding: 0.35rem 0.5rem;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  text-align: left;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.menu-back:hover {
  color: var(--color-text);
}

.menu-heading {
  margin: 0.1rem 0.5rem 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.new-brief-input {
  margin: 0 0.4rem 0.3rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.6rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
</style>
