import { describe, expect, it } from 'vitest'
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
      plugins: [router],
    },
  })

  await flushPromises()
  return wrapper
}

describe('LawSchoolNotes app', () => {
  it('shows the course outlines view on the home route', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('Civil Procedure')
  })

  it('shows the case brief builder and live preview on the case briefs route', async () => {
    const wrapper = await mountApp('/case-briefs')

    expect(wrapper.text()).toContain('Case brief builder')
    await wrapper.get('#case-name').setValue('Palsgraf v. Long Island Railroad Co.')

    expect(wrapper.text()).toContain('Palsgraf v. Long Island Railroad Co.')
    expect(wrapper.text()).toContain('Brief preview')
  })
})
