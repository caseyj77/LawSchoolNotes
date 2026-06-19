import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'
import { useNotesStore } from '@/stores/notesStore'

import App from '../App.vue'
import { routes } from '../router'

const defaultTemplateSections = [
  { id: 'sec-facts', template_id: DEFAULT_TEMPLATE_ID, key: 'facts', label: 'Facts', placeholder: '', position: 1 },
  { id: 'sec-issue', template_id: DEFAULT_TEMPLATE_ID, key: 'issue', label: 'Issue', placeholder: '', position: 2 },
  { id: 'sec-rule', template_id: DEFAULT_TEMPLATE_ID, key: 'rule', label: 'Rule', placeholder: '', position: 3 },
  { id: 'sec-analysis', template_id: DEFAULT_TEMPLATE_ID, key: 'analysis', label: 'Analysis', placeholder: '', position: 4 },
  { id: 'sec-conclusion', template_id: DEFAULT_TEMPLATE_ID, key: 'conclusion', label: 'Conclusion', placeholder: '', position: 5 },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

async function mountApp(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  router.push(path)
  await router.isReady()

  const pinia = createPinia()
  await useNotesStore(pinia).fetchClasses()

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router],
    },
  })

  await flushPromises()
  return wrapper
}

describe('LawSchoolNotes app', () => {
  beforeEach(() => {
    localStorage.clear()
    supabaseMock = createSupabaseMock({ template_sections: defaultTemplateSections })
  })

  it('shows the course outlines view on the home route', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('Civil Procedure')
  })

  it('adds a new class from the home route and links to it', async () => {
    const wrapper = await mountApp('/')

    await wrapper.get('input[placeholder="Class name"]').setValue('Evidence')
    await wrapper.get('input[placeholder="Focus (optional)"]').setValue('Relevance and hearsay.')
    await wrapper.get('.new-class-form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Evidence')
    expect(wrapper.find('a[href*="/class/"]').exists()).toBe(true)
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

  it('deletes a class and its case briefs after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = await mountApp('/class/contracts/case-briefs/new')
    await wrapper.get('#case-name').setValue('Hadley v. Baxendale')
    await wrapper.get('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Hadley v. Baxendale')

    await wrapper.get('.danger').trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).not.toContain('Hadley v. Baxendale')
  })
})
