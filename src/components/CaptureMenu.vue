<script setup>
import { ref } from 'vue'

const props = defineProps({
  position: { type: Object, required: true },
  templateSections: { type: Array, required: true },
})

const emit = defineEmits(['select-section', 'select-outline', 'close'])

const briefExpanded = ref(false)
</script>

<template>
  <div
    class="capture-menu"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @contextmenu.prevent
  >
    <button type="button" class="menu-item" @click="briefExpanded = !briefExpanded">
      Add to Case Brief
    </button>

    <ul v-if="briefExpanded" class="submenu">
      <li v-for="section in props.templateSections" :key="section.key">
        <button type="button" @click="emit('select-section', section.key)">
          {{ section.label }}
        </button>
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
  min-width: 12rem;
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

.submenu button {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  text-align: left;
  font: inherit;
  cursor: pointer;
  border-radius: 0.6rem;
}

.submenu button:hover {
  background: var(--color-bg-alt);
}
</style>
