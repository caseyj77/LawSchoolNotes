import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SectionEditor from '../SectionEditor.vue'

describe('SectionEditor', () => {
  it('renders initial HTML content', async () => {
    const wrapper = mount(SectionEditor, {
      props: { modelValue: '<p>Initial facts.</p>', label: 'Facts' },
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.editor.getHTML()).toContain('Initial facts.')
  })

  it('exposes its Tiptap editor instance for imperative inserts', () => {
    const wrapper = mount(SectionEditor, {
      props: { modelValue: '', label: 'Facts' },
    })

    expect(wrapper.vm.editor).toBeTruthy()
    expect(typeof wrapper.vm.editor.commands.insertContentAt).toBe('function')
  })

  it('appends content at the end without overwriting existing content', async () => {
    const wrapper = mount(SectionEditor, {
      props: { modelValue: '<p>Existing.</p>', label: 'Facts' },
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
