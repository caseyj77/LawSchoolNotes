<script setup>
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  onUpdate: ({ editor: editorInstance }) => {
    emit('update:modelValue', editorInstance.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return
    if (value === editor.value.getHTML()) return
    editor.value.commands.setContent(value, { emitUpdate: false })
  },
)

defineExpose({ editor })
</script>

<template>
  <label class="section-editor">
    {{ label }}
    <div class="editor-shell">
      <EditorContent :editor="editor" />
    </div>
  </label>
</template>

<style scoped>
.section-editor {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
}

.editor-shell {
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  background: var(--color-surface-alt);
  padding: 0.6rem 0.85rem;
}

.editor-shell :deep(.tiptap) {
  min-height: 4rem;
  outline: none;
  font-weight: 400;
  line-height: 1.6;
}

.editor-shell :deep(.tiptap p) {
  margin: 0 0 0.5rem;
}

.editor-shell :deep(.tiptap p:last-child) {
  margin-bottom: 0;
}

.editor-shell :deep(.tiptap blockquote) {
  margin: 0.5rem 0;
  padding-left: 0.85rem;
  border-left: 3px solid var(--color-border);
  color: var(--vintage-grape);
}
</style>
