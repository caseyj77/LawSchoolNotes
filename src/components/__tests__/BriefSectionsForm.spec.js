import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BriefSectionsForm from '../BriefSectionsForm.vue'

function mountForm(brief) {
  return mount(BriefSectionsForm, { props: { brief } })
}

describe('BriefSectionsForm', () => {
  it('renders an editor for each of the 5 brief sections', () => {
    const brief = reactive({ facts: '', issue: '', rule: '', analysis: '', conclusion: '' })
    const wrapper = mountForm(brief)

    expect(wrapper.text()).toContain('Facts')
    expect(wrapper.text()).toContain('Issue')
    expect(wrapper.text()).toContain('Rule')
    expect(wrapper.text()).toContain('Analysis')
    expect(wrapper.text()).toContain('Conclusion')
  })

  it('exposes getSectionEditor so a parent can target a specific section', async () => {
    const brief = reactive({ facts: '<p>Initial.</p>', issue: '', rule: '', analysis: '', conclusion: '' })
    const wrapper = mountForm(brief)
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.getSectionEditor('facts')
    expect(editor).toBeTruthy()
    expect(editor.getHTML()).toContain('Initial.')
  })

  it('appending via the exposed editor does not overwrite existing content', async () => {
    const brief = reactive({ facts: '<p>Existing facts.</p>', issue: '', rule: '', analysis: '', conclusion: '' })
    const wrapper = mountForm(brief)
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.getSectionEditor('facts')
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: 'blockquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Captured excerpt.' }] }],
    })

    expect(editor.getHTML()).toContain('Existing facts.')
    expect(editor.getHTML()).toContain('Captured excerpt.')
  })
})
