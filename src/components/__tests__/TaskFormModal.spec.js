import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import TaskFormModal from '../TaskFormModal.vue'

const courses = [{ id: 'c1', title: 'Contracts' }]

function mountModal(props = {}) {
  return mount(TaskFormModal, { props: { courses, ...props } })
}

// VeeValidate's submit validation resolves on a real macrotask tick, not just
// microtasks — flushPromises() alone won't advance it (see App.spec's waitFor).
async function submitAndWait(wrapper) {
  await wrapper.get('form').trigger('submit')
  for (let i = 0; i < 20 && !wrapper.emitted('submit'); i += 1) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

describe('TaskFormModal', () => {
  it('emits submit with a null id and the entered values when creating', async () => {
    const wrapper = mountModal()
    await wrapper.get('input[placeholder="Outline Contracts Ch. 4"]').setValue('Read Ch. 4')
    await submitAndWait(wrapper)

    const submit = wrapper.emitted('submit')
    expect(submit).toHaveLength(1)
    expect(submit[0][0].id).toBeNull()
    expect(submit[0][0].values.title).toBe('Read Ch. 4')
  })

  it('prefills from an existing task and submits with its id', async () => {
    const task = {
      id: 'task-9',
      title: 'Existing',
      description: 'desc',
      startDate: '2026-06-01',
      dueDate: '2026-06-02',
      tags: ['reading'],
      courseId: 'c1',
    }
    const wrapper = mountModal({ task })

    expect(wrapper.get('input[placeholder="Outline Contracts Ch. 4"]').element.value).toBe('Existing')

    await submitAndWait(wrapper)

    expect(wrapper.emitted('submit')[0][0].id).toBe('task-9')
  })

  it('does not submit when the title is blank', async () => {
    const wrapper = mountModal()
    await submitAndWait(wrapper)

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('carries presetDates through to the submitted values', async () => {
    const wrapper = mountModal({ presetDates: { startDate: '2026-06-10', dueDate: '2026-06-10' } })
    await wrapper.get('input[placeholder="Outline Contracts Ch. 4"]').setValue('From calendar')
    await submitAndWait(wrapper)

    const { values } = wrapper.emitted('submit')[0][0]
    expect(values.startDate).toBe('2026-06-10')
    expect(values.dueDate).toBe('2026-06-10')
  })

  it('emits delete with the task id, and close on cancel', async () => {
    const wrapper = mountModal({ task: { id: 'task-9', title: 'X', tags: [] } })

    await wrapper.get('.delete-button').trigger('click')
    expect(wrapper.emitted('delete')[0]).toEqual(['task-9'])

    await wrapper.get('.cancel-button').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('only shows the Delete button when editing', () => {
    expect(mountModal().find('.delete-button').exists()).toBe(false)
    expect(mountModal({ task: { id: 'x', title: 'X', tags: [] } }).find('.delete-button').exists()).toBe(true)
  })
})
