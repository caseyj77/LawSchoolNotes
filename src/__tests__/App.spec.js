import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'

import { createSupabaseMock } from '@/lib/__tests__/supabaseTestUtils'
import { useAuthStore } from '@/stores/auth'
import { useNotesStore } from '@/stores/notesStore'

import App from '../App.vue'
import { routes } from '../router'

const TEST_USER_ID = 'test-user-id'
const TEST_TEMPLATE_ID = 'test-template'

const defaultTemplates = [{ id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, name: 'Law School Case Brief' }]

const defaultTemplateSections = [
  { id: 'sec-facts', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'facts', label: 'Facts', placeholder: '', position: 1 },
  { id: 'sec-issue', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'issue', label: 'Issue', placeholder: '', position: 3 },
  { id: 'sec-rule', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'rule', label: 'Rule', placeholder: '', position: 4 },
  { id: 'sec-analysis', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'analysis', label: 'Analysis / Reasoning', placeholder: '', position: 6 },
  { id: 'sec-conclusion', template_id: TEST_TEMPLATE_ID, user_id: TEST_USER_ID, key: 'conclusion', label: 'Conclusion / Disposition', placeholder: '', position: 7 },
]

let supabaseMock

vi.mock('@/lib/supabaseClient', () => ({
  get supabase() {
    return supabaseMock
  },
}))

// Route components are lazy-loaded, and the first import() of a heavy chain
// (e.g. CaseBriefsView -> SectionEditor -> Tiptap) is real module-compilation
// work that a single flushPromises() microtask flush won't wait out — poll
// with real timer ticks instead.
async function waitFor(assertion, { timeout = 2000, interval = 20 } = {}) {
  const deadline = Date.now() + timeout
  for (;;) {
    try {
      assertion()
      return
    } catch (error) {
      if (Date.now() >= deadline) throw error
      await flushPromises()
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }
}

// `path` may be a function of the seeded courses, since course ids are
// generated fresh on every seed (see notesStore.fetchCourses) rather than
// fixed literals.
async function mountApp(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })

  const pinia = createPinia()
  useAuthStore(pinia).user = { id: TEST_USER_ID }
  const courses = await useNotesStore(pinia).fetchCourses()

  router.push(typeof path === 'function' ? path(courses) : path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router],
    },
  })

  await flushPromises()
  return wrapper
}

function contractsCourseId(courses) {
  return courses.find((course) => course.title === 'Contracts').id
}

describe('LawSchoolNotes app', () => {
  beforeEach(() => {
    localStorage.clear()
    supabaseMock = createSupabaseMock({
      templates: defaultTemplates,
      template_sections: defaultTemplateSections,
    })
  })

  it('shows the course outlines view on the home route', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('Civil Procedure')
  })

  it('adds a new course from the home route and links to it', async () => {
    const wrapper = await mountApp('/')

    await wrapper.get('input[placeholder="Course name"]').setValue('Evidence')
    await wrapper.get('input[placeholder="Focus (optional)"]').setValue('Relevance and hearsay.')
    await wrapper.get('.new-course-form').trigger('submit')
    // VeeValidate's schema validation resolves over a few more microtask hops
    // than a single flushPromises() flush covers.
    await waitFor(() => expect(wrapper.text()).toContain('Evidence'))
    expect(wrapper.find('a[href*="/course/"]').exists()).toBe(true)
  })

  it('creates a case brief with a citation and student notes from the course view', async () => {
    let courseId
    const wrapper = await mountApp((courses) => {
      courseId = contractsCourseId(courses)
      return `/course/${courseId}`
    })

    expect(wrapper.text()).toContain('Contracts')
    expect(wrapper.text()).toContain('No outline yet')
    expect(wrapper.text()).toContain('No case briefs yet')

    await wrapper.get(`a[href="/course/${courseId}/case-briefs/new"]`).trigger('click')
    await waitFor(() => expect(wrapper.text()).toContain('Case brief builder'))
    await wrapper.get('#case-name').setValue('Hadley v. Baxendale')
    await wrapper.get('#citation').setValue('9 Ex. 341 (1854)')
    await wrapper.find('textarea[placeholder="Anything else worth remembering?"]').setValue(
      'Foreseeability limits consequential damages.',
    )

    expect(wrapper.text()).toContain('Hadley v. Baxendale')
    expect(wrapper.text()).toContain('9 Ex. 341 (1854)')

    await wrapper.get('.save-button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No outline yet')
    expect(wrapper.text()).toContain('Hadley v. Baxendale')
    expect(wrapper.text()).toContain('9 Ex. 341 (1854)')
  })

  it('deletes a course and its case briefs after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = await mountApp((courses) => `/course/${contractsCourseId(courses)}/case-briefs/new`)
    await wrapper.get('#case-name').setValue('Hadley v. Baxendale')
    await wrapper.get('#citation').setValue('9 Ex. 341 (1854)')
    await wrapper.get('.save-button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Hadley v. Baxendale')

    await wrapper.get('.danger').trigger('click')
    await flushPromises()

    expect(window.confirm).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Course outlines')
    expect(wrapper.text()).not.toContain('Hadley v. Baxendale')
  })
})
