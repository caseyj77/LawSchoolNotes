import { reactive } from 'vue'
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import BriefSectionsForm from '../BriefSectionsForm.vue'

const EMPTY_DOC = { type: 'doc', content: [] }

function doc(text) {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

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
    const brief = reactive({
      sections: { facts: EMPTY_DOC, issue: EMPTY_DOC, rule: EMPTY_DOC, analysis: EMPTY_DOC, conclusion: EMPTY_DOC },
    })
    const wrapper = mountForm(brief)

    expect(wrapper.text()).toContain('Facts')
    expect(wrapper.text()).toContain('Issue')
    expect(wrapper.text()).toContain('Rule')
    expect(wrapper.text()).toContain('Analysis')
    expect(wrapper.text()).toContain('Conclusion')
  })

  it('renders only the sections provided by the template, not a hardcoded set', () => {
    const shortTemplate = [{ key: 'summary', label: 'Summary', placeholder: 'Summarize it.' }]
    const brief = reactive({ sections: { summary: EMPTY_DOC } })
    const wrapper = mountForm(brief, shortTemplate)

    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).not.toContain('Facts')
  })

  it('exposes getSectionEditor so a parent can target a specific section', async () => {
    const brief = reactive({
      sections: { facts: doc('Initial.'), issue: EMPTY_DOC, rule: EMPTY_DOC, analysis: EMPTY_DOC, conclusion: EMPTY_DOC },
    })
    const wrapper = mountForm(brief)
    await wrapper.vm.$nextTick()

    const editor = wrapper.vm.getSectionEditor('facts')
    expect(editor).toBeTruthy()
    expect(editor.getHTML()).toContain('Initial.')
  })

  it('appending via the exposed editor does not overwrite existing content', async () => {
    const brief = reactive({
      sections: {
        facts: doc('Existing facts.'),
        issue: EMPTY_DOC,
        rule: EMPTY_DOC,
        analysis: EMPTY_DOC,
        conclusion: EMPTY_DOC,
      },
    })
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
