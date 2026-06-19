import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BriefSectionsForm from '../BriefSectionsForm.vue'

const templateSections = [
  { key: 'facts', label: 'Facts', placeholder: 'What happened?' },
  { key: 'issue', label: 'Issue', placeholder: 'What legal question did the court resolve?' },
  { key: 'rule', label: 'Rule', placeholder: 'What rule controlled the outcome?' },
  { key: 'analysis', label: 'Analysis', placeholder: 'How did the court reason through the issue?' },
  { key: 'conclusion', label: 'Conclusion', placeholder: 'What should you remember for class or exams?' },
]

function mountForm(brief, sections = templateSections) {
  return mount(BriefSectionsForm, { props: { brief, templateSections: sections } })
}

describe('BriefSectionsForm', () => {
  it('renders an editor for each section in the given template', () => {
    const brief = reactive({ sections: { facts: '', issue: '', rule: '', analysis: '', conclusion: '' } })
    const wrapper = mountForm(brief)

    expect(wrapper.text()).toContain('Facts')
    expect(wrapper.text()).toContain('Issue')
    expect(wrapper.text()).toContain('Rule')
    expect(wrapper.text()).toContain('Analysis')
    expect(wrapper.text()).toContain('Conclusion')
  })

  it('renders only the sections provided by the template, not a hardcoded set', () => {
    const shortTemplate = [{ key: 'summary', label: 'Summary', placeholder: 'Summarize it.' }]
    const brief = reactive({ sections: { summary: '' } })
    const wrapper = mountForm(brief, shortTemplate)

    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).not.toContain('Facts')
  })

  it('exposes getSectionEditor so a parent can target a specific section', async () => {
    const brief = reactive({ sections: { facts: '<p>Initial.</p>', issue: '', rule: '', analysis: '', conclusion: '' } })
    const wrapper = mountForm(brief)
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.getSectionEditor('facts')
    expect(editor).toBeTruthy()
    expect(editor.getHTML()).toContain('Initial.')
  })

  it('appending via the exposed editor does not overwrite existing content', async () => {
    const brief = reactive({ sections: { facts: '<p>Existing facts.</p>', issue: '', rule: '', analysis: '', conclusion: '' } })
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
