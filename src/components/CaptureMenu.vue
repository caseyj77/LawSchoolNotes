<script setup>
import { ref } from 'vue'

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

const briefExpanded = ref(false)
// Which existing brief's section list is open (null = none).
const expandedBriefId = ref(null)
const creatingBrief = ref(false)
const newBriefName = ref('')

function toggleBrief(briefId) {
  expandedBriefId.value = expandedBriefId.value === briefId ? null : briefId
  creatingBrief.value = false
}

function startNewBrief() {
  creatingBrief.value = true
  expandedBriefId.value = null
}

function briefLabel(brief) {
  return brief.caseName || 'Untitled case brief'
}
</script>

<template>
  <div
    class="capture-menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @contextmenu.prevent
  >
    <button
      v-if="props.canHighlight"
      type="button"
      class="menu-item"
      @click="emit('select-highlight')"
    >
      Highlight
    </button>

    <button type="button" class="menu-item" @click="briefExpanded = !briefExpanded">
      Add to Case Brief
    </button>

    <ul v-if="briefExpanded" class="submenu">
      <li v-for="brief in props.briefs" :key="brief.id">
        <button type="button" class="brief-row" @click="toggleBrief(brief.id)">
          {{ briefLabel(brief) }}
        </button>
        <ul v-if="expandedBriefId === brief.id" class="submenu submenu-nested">
          <li v-for="section in props.templateSections" :key="section.key">
            <button
              type="button"
              @click="emit('select-brief-section', { briefId: brief.id, sectionKey: section.key })"
            >
              {{ section.label }}
            </button>
          </li>
        </ul>
      </li>

      <li>
        <button type="button" class="brief-row new-brief" @click="startNewBrief">
          + New case brief
        </button>
        <div v-if="creatingBrief" class="new-brief-panel">
          <input
            v-model.trim="newBriefName"
            type="text"
            placeholder="Case name"
            class="new-brief-input"
          >
          <p class="new-brief-hint">Then pick a section:</p>
          <ul class="submenu submenu-nested">
            <li v-for="section in props.templateSections" :key="section.key">
              <button
                type="button"
                :disabled="!newBriefName"
                @click="emit('create-brief-section', { caseName: newBriefName, sectionKey: section.key })"
              >
                {{ section.label }}
              </button>
            </li>
          </ul>
        </div>
      </li>
    </ul>

    <button type="button" class="menu-item" @click="emit('select-outline')">Add to Outline</button>

    <button type="button" class="menu-item close" @click="emit('close')">Cancel</button>
  </div>
</template>

<style scoped>
.capture-menu {
  position: fixed;
  z-index: 50;
  display: grid;
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

.submenu {
  display: grid;
  padding: 0;
  margin: 0 0 0 0.75rem;
  list-style: none;
  border-left: 2px solid var(--color-border);
}

.submenu-nested {
  margin-left: 0.6rem;
}

.submenu button {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  color: var(--color-text);
  text-align: left;
  font: inherit;
  cursor: pointer;
  border-radius: 0.6rem;
}

.submenu button:hover:not(:disabled) {
  background: var(--color-bg-alt);
}

.submenu button:disabled {
  color: var(--color-disabled);
  cursor: not-allowed;
}

.brief-row {
  font-weight: 600;
}

.new-brief {
  color: var(--color-accent);
}

.new-brief-panel {
  display: grid;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem 0.5rem;
}

.new-brief-input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.6rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.new-brief-hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}
</style>
