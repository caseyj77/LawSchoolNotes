import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

import App from '../App.vue'
import { routes } from '../router'

async function mountApp(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [createPinia(), router],
    },
  })

  await flushPromises()
  return wrapper
}

describe('LawSchoolNotes app', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows the course outlines view on the home route', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('Civil Procedure')
  })

  it('creates a case brief with a citation and student notes from the class view', async () => {
    const wrapper = await mountApp('/class/contracts')

    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('No outline yet')
    expect(wrapper.text()).toContain('No case briefs yet')

    await wrapper.get('a[href="/class/contracts/case-briefs/new"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Case brief builder')
    await wrapper.get('#case-name').setValue('Hadley v. Baxendale')
    await wrapper.get('#citation').setValue('9 Ex. 341 (1854)')
    await wrapper.find('textarea[placeholder="Anything else worth remembering?"]').setValue(
      'Foreseeability limits consequential damages.',
    )

    expect(wrapper.text()).toContain('Hadley v. Baxendale')
    expect(wrapper.text()).toContain('9 Ex. 341 (1854)')

    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No outline yet')
    expect(wrapper.text()).toContain('Hadley v. Baxendale')
    expect(wrapper.text()).toContain('9 Ex. 341 (1854)')
  })
})
