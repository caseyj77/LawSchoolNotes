import { describe, expect, it } from 'vitest'

import { buildTasksIcs } from '@/lib/exportTasksToIcs'

describe('buildTasksIcs', () => {
  it('wraps events in a VCALENDAR envelope', () => {
    const ics = buildTasksIcs([])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
  })

  it('emits an all-day VEVENT with DTEND one day after the due date (exclusive)', () => {
    const ics = buildTasksIcs([
      { id: 't1', title: 'Read Ch. 4', startDate: '2026-06-01', dueDate: '2026-06-03', tags: [] },
    ])
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('UID:t1@lawschoolnotes')
    expect(ics).toContain('DTSTART;VALUE=DATE:20260601')
    expect(ics).toContain('DTEND;VALUE=DATE:20260604')
    expect(ics).toContain('SUMMARY:Read Ch. 4')
  })

  it('treats a single-dated task as one day', () => {
    const ics = buildTasksIcs([{ id: 't2', title: 'Exam', startDate: '', dueDate: '2026-06-05', tags: [] }])
    expect(ics).toContain('DTSTART;VALUE=DATE:20260605')
    expect(ics).toContain('DTEND;VALUE=DATE:20260606')
  })

  it('skips tasks with no dates', () => {
    const ics = buildTasksIcs([{ id: 't3', title: 'Someday', startDate: '', dueDate: '', tags: [] }])
    expect(ics).not.toContain('BEGIN:VEVENT')
  })

  it('escapes commas and semicolons in the summary', () => {
    const ics = buildTasksIcs([{ id: 't4', title: 'Read; brief, outline', startDate: '2026-06-01', dueDate: '2026-06-01' }])
    expect(ics).toContain('SUMMARY:Read\\; brief\\, outline')
  })
})
