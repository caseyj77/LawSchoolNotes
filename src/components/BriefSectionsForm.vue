<script setup>
import SectionEditor from '@/components/SectionEditor.vue'

const props = defineProps({
  brief: { type: Object, required: true },
})

const sections = [
  { key: 'facts', label: 'Facts', placeholder: 'What happened?' },
  { key: 'issue', label: 'Issue', placeholder: 'What legal question did the court resolve?' },
  { key: 'rule', label: 'Rule', placeholder: 'What rule controlled the outcome?' },
  { key: 'analysis', label: 'Analysis', placeholder: 'How did the court reason through the issue?' },
  { key: 'conclusion', label: 'Conclusion', placeholder: 'What should you remember for class or exams?' },
]

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
      v-for="section in sections"
      :key="section.key"
      :ref="(instance) => setEditorRef(section.key, instance)"
      v-model="props.brief[section.key]"
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
