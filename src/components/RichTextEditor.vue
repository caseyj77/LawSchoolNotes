<script setup>
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { watch } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({ type: 'doc', content: [] }) },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit],
  onUpdate: ({ editor: editorInstance }) => {
    emit('update:modelValue', editorInstance.getJSON())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return
    if (JSON.stringify(value) === JSON.stringify(editor.value.getJSON())) return
    editor.value.commands.setContent(value, { emitUpdate: false })
  },
)

const toolbarGroups = [
  [
    { label: 'B', title: 'Bold', isActive: 'bold', run: (chain) => chain.toggleBold() },
    { label: 'I', title: 'Italic', isActive: 'italic', run: (chain) => chain.toggleItalic() },
    { label: 'S', title: 'Strikethrough', isActive: 'strike', run: (chain) => chain.toggleStrike() },
    { label: '<>', title: 'Inline code', isActive: 'code', run: (chain) => chain.toggleCode() },
  ],
  [
    {
      label: 'H1',
      title: 'Heading 1',
      isActive: 'heading',
      activeAttrs: { level: 1 },
      run: (chain) => chain.toggleHeading({ level: 1 }),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      isActive: 'heading',
      activeAttrs: { level: 2 },
      run: (chain) => chain.toggleHeading({ level: 2 }),
    },
    {
      label: 'H3',
      title: 'Heading 3',
      isActive: 'heading',
      activeAttrs: { level: 3 },
      run: (chain) => chain.toggleHeading({ level: 3 }),
    },
  ],
  [
    { label: '•', title: 'Bullet list', isActive: 'bulletList', run: (chain) => chain.toggleBulletList() },
    { label: '1.', title: 'Ordered list', isActive: 'orderedList', run: (chain) => chain.toggleOrderedList() },
    { label: '❝', title: 'Blockquote', isActive: 'blockquote', run: (chain) => chain.toggleBlockquote() },
    { label: '—', title: 'Horizontal rule', isActive: null, run: (chain) => chain.setHorizontalRule() },
  ],
  [
    { label: '↺', title: 'Undo', isActive: null, run: (chain) => chain.undo(), canRun: 'undo' },
    { label: '↻', title: 'Redo', isActive: null, run: (chain) => chain.redo(), canRun: 'redo' },
  ],
]

function runCommand(item) {
  if (!editor.value) return
  item.run(editor.value.chain().focus()).run()
}

function isItemActive(item) {
  if (!editor.value || !item.isActive) return false
  return editor.value.isActive(item.isActive, item.activeAttrs)
}

function canRunItem(item) {
  if (!editor.value || !item.canRun) return true
  return editor.value.can()[item.canRun]()
}

defineExpose({ editor })
</script>

<template>
  <label class="section-editor">
    {{ label }}
    <div class="editor-shell">
      <div v-if="editor" class="editor-toolbar">
        <div v-for="(group, index) in toolbarGroups" :key="index" class="toolbar-group">
          <button
            v-for="item in group"
            :key="item.title"
            type="button"
            class="toolbar-button"
            :class="{ 'is-active': isItemActive(item) }"
            :title="item.title"
            :disabled="!canRunItem(item)"
            @click="runCommand(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
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

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--color-border);
}

.toolbar-group {
  display: flex;
  gap: 0.25rem;
  padding-right: 0.6rem;
  border-right: 1px solid var(--color-border);
}

.toolbar-group:last-child {
  padding-right: 0;
  border-right: none;
}

.toolbar-button {
  min-width: 1.9rem;
  padding: 0.3rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.toolbar-button:hover:not(:disabled) {
  background: var(--color-bg-alt);
}

.toolbar-button.is-active {
  background: var(--color-active-bg);
  color: var(--color-active-text);
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
