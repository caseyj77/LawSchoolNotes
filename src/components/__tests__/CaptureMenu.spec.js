import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import CaptureMenu from '../CaptureMenu.vue'

describe('CaptureMenu', () => {
  it('emits select-outline when "Add to Outline" is clicked', async () => {
    const wrapper = mount(CaptureMenu, { props: { position: { x: 0, y: 0 } } })

    await wrapper.get('button.menu-item').trigger('click') // Add to Case Brief expands, not this one
    const outlineButton = wrapper
      .findAll('button.menu-item')
      .find((button) => button.text() === 'Add to Outline')
    await outlineButton.trigger('click')

    expect(wrapper.emitted('select-outline')).toHaveLength(1)
  })

  it('expands the case brief submenu and emits select-section with the chosen key', async () => {
    const wrapper = mount(CaptureMenu, { props: { position: { x: 0, y: 0 } } })

    await wrapper.get('button.menu-item').trigger('click')
    const factsButton = wrapper.findAll('.submenu button').find((b) => b.text() === 'Facts')
    await factsButton.trigger('click')

    expect(wrapper.emitted('select-section')).toEqual([['facts']])
  })

  it('emits close when Cancel is clicked', async () => {
    const wrapper = mount(CaptureMenu, { props: { position: { x: 0, y: 0 } } })

    await wrapper.get('button.close').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
