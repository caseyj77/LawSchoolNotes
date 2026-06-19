<script setup>
import SectionEditor from '@/components/SectionEditor.vue'

const props = defineProps({
  brief: { type: Object, required: true },
  templateSections: { type: Array, required: true },
})

const editorRefs = {}

function setEditorRef(key, instance) {
  if (instance) editorRefs[key] = instance
  else delete editorRefs[key]
}

function getSectionEditor(key) {
  return editorRefs[key]?.editor
}

defineExpose({ getSectionEditor })
</script>

<template>
  <div class="brief-sections-form">
    <SectionEditor
      v-for="section in props.templateSections"
      :key="section.key"
      :ref="(instance) => setEditorRef(section.key, instance)"
      v-model="props.brief.sections[section.key]"
      :label="section.label"
      :placeholder="section.placeholder"
    />
  </div>
</template>

<style scoped>
.brief-sections-form {
  display: grid;
  gap: 1rem;
}
</style>
