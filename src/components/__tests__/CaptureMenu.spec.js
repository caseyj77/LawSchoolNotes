import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CaptureMenu from '../CaptureMenu.vue'

const templateSections = [
  { key: 'facts', label: 'Facts' },
  { key: 'holding', label: 'Holding' },
]

const briefs = [
  { id: 'brief-1', caseName: 'Hadley v. Baxendale' },
  { id: 'brief-2', caseName: '' },
]

function mountMenu(props = {}) {
  return mount(CaptureMenu, {
    props: { position: { x: 0, y: 0 }, templateSections, briefs, ...props },
  })
}

function byText(wrapper, selector, text) {
  return wrapper.findAll(selector).find((node) => node.text() === text)
}

describe('CaptureMenu', () => {
  it('emits select-outline when "Add to Outline" is clicked', async () => {
    const wrapper = mountMenu()
    await byText(wrapper, 'button.menu-item', 'Add to Outline').trigger('click')
    expect(wrapper.emitted('select-outline')).toHaveLength(1)
  })

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mountMenu()
    await wrapper.get('button.close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('only offers Highlight when the selection carries anchor geometry', async () => {
    expect(byText(mountMenu(), 'button.menu-item', 'Highlight')).toBeUndefined()

    const wrapper = mountMenu({ canHighlight: true })
    const highlight = byText(wrapper, 'button.menu-item', 'Highlight')
    expect(highlight).toBeDefined()
    await highlight.trigger('click')
    expect(wrapper.emitted('select-highlight')).toHaveLength(1)
  })

  it('chooses an existing brief then a section, emitting select-brief-section', async () => {
    const wrapper = mountMenu()

    await byText(wrapper, 'button.menu-item', 'Add to Case Brief').trigger('click')
    await byText(wrapper, '.submenu button', 'Hadley v. Baxendale').trigger('click')
    await byText(wrapper, '.submenu-nested button', 'Holding').trigger('click')

    expect(wrapper.emitted('select-brief-section')).toEqual([
      [{ briefId: 'brief-1', sectionKey: 'holding' }],
    ])
  })

  it('shows an untitled label for a brief with no case name', async () => {
    const wrapper = mountMenu()
    await byText(wrapper, 'button.menu-item', 'Add to Case Brief').trigger('click')
    expect(byText(wrapper, '.submenu button', 'Untitled case brief')).toBeDefined()
  })

  it('creates a new brief (name + section), emitting create-brief-section', async () => {
    const wrapper = mountMenu()

    await byText(wrapper, 'button.menu-item', 'Add to Case Brief').trigger('click')
    await byText(wrapper, '.submenu button', '+ New case brief').trigger('click')
    await wrapper.get('input.new-brief-input').setValue('Palsgraf')
    await byText(wrapper, '.new-brief-panel .submenu-nested button', 'Facts').trigger('click')

    expect(wrapper.emitted('create-brief-section')).toEqual([
      [{ caseName: 'Palsgraf', sectionKey: 'facts' }],
    ])
  })

  it('disables the new-brief section buttons until a case name is entered', async () => {
    const wrapper = mountMenu()
    await byText(wrapper, 'button.menu-item', 'Add to Case Brief').trigger('click')
    await byText(wrapper, '.submenu button', '+ New case brief').trigger('click')

    const factsButton = byText(wrapper, '.new-brief-panel .submenu-nested button', 'Facts')
    expect(factsButton.attributes('disabled')).toBeDefined()
  })

  it('renders only the sections provided by the template', async () => {
    const wrapper = mountMenu({ templateSections: [{ key: 'summary', label: 'Summary' }] })
    await byText(wrapper, 'button.menu-item', 'Add to Case Brief').trigger('click')
    await byText(wrapper, '.submenu button', 'Hadley v. Baxendale').trigger('click')

    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).not.toContain('Holding')
  })
})
