import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import RichTextEditor from '../RichTextEditor.vue'

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

describe('RichTextEditor', () => {
  it('renders initial JSON content', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: doc('Initial facts.'), label: 'Facts' },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.editor.getHTML()).toContain('Initial facts.')
  })

  it('exposes its Tiptap editor instance for imperative inserts', () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: { type: 'doc', content: [] }, label: 'Facts' },
    })

    expect(wrapper.vm.editor).toBeTruthy()
    expect(typeof wrapper.vm.editor.commands.insertContentAt).toBe('function')
  })

  it('emits the updated content as Tiptap JSON, not HTML', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: { type: 'doc', content: [] }, label: 'Facts' },
    })
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.editor
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Typed.' }],
    })

    const emitted = wrapper.emitted('update:modelValue')
    const lastValue = emitted[emitted.length - 1][0]
    expect(lastValue.type).toBe('doc')
    expect(JSON.stringify(lastValue)).toContain('Typed.')
  })

  it('appends content at the end without overwriting existing content', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: doc('Existing.'), label: 'Facts' },
    })
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.editor
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Appended.' }],
    })

    expect(editor.getHTML()).toContain('Existing.')
    expect(editor.getHTML()).toContain('Appended.')
  })
})
