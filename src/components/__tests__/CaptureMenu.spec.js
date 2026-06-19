import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CaptureMenu from '../CaptureMenu.vue'

const templateSections = [
  { key: 'facts', label: 'Facts' },
  { key: 'issue', label: 'Issue' },
  { key: 'rule', label: 'Rule' },
  { key: 'analysis', label: 'Analysis' },
  { key: 'conclusion', label: 'Conclusion' },
]

function mountMenu(sections = templateSections) {
  return mount(CaptureMenu, { props: { position: { x: 0, y: 0 }, templateSections: sections } })
}

describe('CaptureMenu', () => {
  it('emits select-outline when "Add to Outline" is clicked', async () => {
    const wrapper = mountMenu()

    await wrapper.get('button.menu-item').trigger('click') // Add to Case Brief expands, not this one
    const outlineButton = wrapper
      .findAll('button.menu-item')
      .find((button) => button.text() === 'Add to Outline')
    await outlineButton.trigger('click')

    expect(wrapper.emitted('select-outline')).toHaveLength(1)
  })

  it('expands the case brief submenu and emits select-section with the chosen key', async () => {
    const wrapper = mountMenu()

    await wrapper.get('button.menu-item').trigger('click')
    const factsButton = wrapper.findAll('.submenu button').find((b) => b.text() === 'Facts')
    await factsButton.trigger('click')

    expect(wrapper.emitted('select-section')).toEqual([['facts']])
  })

  it('renders only the sections provided by the template, not a hardcoded set', async () => {
    const wrapper = mountMenu([{ key: 'summary', label: 'Summary' }])

    await wrapper.get('button.menu-item').trigger('click')

    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).not.toContain('Facts')
  })

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mountMenu()

    await wrapper.get('button.close').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
