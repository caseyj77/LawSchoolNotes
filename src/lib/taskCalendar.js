// Pure helpers for mapping tasks <-> FullCalendar events, kept out of the
// component so the date/overdue logic is unit-testable without mounting the
// calendar.

export const STATUS_META = {
  todo: { label: 'To do', color: 'var(--color-accent)' },
  in_progress: { label: 'In progress', color: 'var(--jungle-teal)' },
  done: { label: 'Done', color: 'var(--color-disabled)' },
}

// Local yyyy-MM-dd from a Date or an existing date string (FullCalendar hands
// back Date objects on drag/resize; tasks store dates as yyyy-MM-dd strings).
export function toDateStr(value) {
  if (!value) return ''
  // Pass an existing date string through as-is — round-tripping a 'yyyy-MM-dd'
  // string through `new Date()` parses it as UTC midnight and then reads local
  // fields, shifting the day by one in any timezone behind UTC.
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function taskHasSchedule(task) {
  return Boolean(task.startDate || task.dueDate)
}

// Builds a FullCalendar event for a task. start/end are Date objects; the end
// is EXCLUSIVE (FullCalendar's all-day convention), so to cover the full due
// day the end is the day after the due date (a 6/24 → 6/26 task ends at 6/27).
// A task with only one date is a single day.
export function taskToEvent(task) {
  const start = parseLocalDate(task.startDate || task.dueDate)
  const end = parseLocalDate(task.dueDate || task.startDate)
  end.setDate(end.getDate() + 1)
  return {
    id: task.id,
    title: task.title,
    start,
    end,
    allDay: true,
    draggable: true,
    resizable: true,
  }
}

// Converts a FullCalendar event (after drag/resize) back to task date fields.
// The event end is exclusive (see taskToEvent), so the due date is the last day
// the bar actually covers — one millisecond before the end instant.
export function eventToDates(event) {
  const start = event.start instanceof Date ? event.start : new Date(event.start)
  const end = event.end instanceof Date ? event.end : new Date(event.end)
  const lastCoveredDay = new Date(end.getTime() - 1)
  return { startDate: toDateStr(start), dueDate: toDateStr(lastCoveredDay) }
}

export function isTaskOverdue(task, today = new Date()) {
  if (!task.dueDate || task.status === 'done') return false
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return parseLocalDate(task.dueDate) < midnight
}
