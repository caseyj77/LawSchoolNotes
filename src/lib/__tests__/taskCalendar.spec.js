import { describe, expect, it } from 'vitest'

import {
  eventToDates,
  isTaskOverdue,
  taskHasSchedule,
  taskToEvent,
  toDateStr,
} from '@/lib/taskCalendar'

describe('taskCalendar', () => {
  describe('toDateStr', () => {
    it('formats a Date as local yyyy-MM-dd', () => {
      expect(toDateStr(new Date(2026, 5, 9))).toBe('2026-06-09')
    })

    it('passes through an existing date string', () => {
      expect(toDateStr('2026-06-09')).toBe('2026-06-09')
    })

    it('returns empty string for empty input', () => {
      expect(toDateStr('')).toBe('')
      expect(toDateStr(null)).toBe('')
    })
  })

  describe('taskToEvent', () => {
    it('spans start to an exclusive end one day past the due date', () => {
      const event = taskToEvent({ id: 't1', title: 'Read', startDate: '2026-06-01', dueDate: '2026-06-05' })
      expect(event).toMatchObject({ id: 't1', title: 'Read', allDay: true })
      expect(toDateStr(event.start)).toBe('2026-06-01')
      // End is exclusive: the bar covers through 6/05, so end is 6/06.
      expect(toDateStr(event.end)).toBe('2026-06-06')
    })

    it('makes a single-day bar when only a due date exists', () => {
      const event = taskToEvent({ id: 't2', title: 'Exam', startDate: '', dueDate: '2026-06-05' })
      expect(toDateStr(event.start)).toBe('2026-06-05')
      expect(toDateStr(event.end)).toBe('2026-06-06')
    })

    it('makes a single-day bar when only a start date exists', () => {
      const event = taskToEvent({ id: 't3', title: 'Begin', startDate: '2026-06-02', dueDate: '' })
      expect(toDateStr(event.start)).toBe('2026-06-02')
      expect(toDateStr(event.end)).toBe('2026-06-03')
    })

    it('round-trips through eventToDates', () => {
      const task = { id: 't4', title: 'X', startDate: '2026-06-24', dueDate: '2026-06-26' }
      expect(eventToDates(taskToEvent(task))).toEqual({ startDate: '2026-06-24', dueDate: '2026-06-26' })
    })
  })

  describe('eventToDates', () => {
    it('converts an exclusive-end FullCalendar event back to inclusive task dates', () => {
      // end of 6/04 (exclusive) means the bar covers through 6/03.
      const dates = eventToDates({ start: new Date(2026, 5, 1), end: new Date(2026, 5, 4) })
      expect(dates).toEqual({ startDate: '2026-06-01', dueDate: '2026-06-03' })
    })
  })

  describe('taskHasSchedule', () => {
    it('is true when either date is set, false when neither', () => {
      expect(taskHasSchedule({ startDate: '2026-06-01', dueDate: '' })).toBe(true)
      expect(taskHasSchedule({ startDate: '', dueDate: '2026-06-01' })).toBe(true)
      expect(taskHasSchedule({ startDate: '', dueDate: '' })).toBe(false)
    })
  })

  describe('isTaskOverdue', () => {
    const today = new Date(2026, 5, 15)

    it('is true when due date is before today and not done', () => {
      expect(isTaskOverdue({ dueDate: '2026-06-10', status: 'todo' }, today)).toBe(true)
    })

    it('is false when the task is done', () => {
      expect(isTaskOverdue({ dueDate: '2026-06-10', status: 'done' }, today)).toBe(false)
    })

    it('is false when due date is today or later', () => {
      expect(isTaskOverdue({ dueDate: '2026-06-15', status: 'todo' }, today)).toBe(false)
      expect(isTaskOverdue({ dueDate: '2026-06-20', status: 'todo' }, today)).toBe(false)
    })

    it('is false when there is no due date', () => {
      expect(isTaskOverdue({ dueDate: '', status: 'todo' }, today)).toBe(false)
    })
  })
})
