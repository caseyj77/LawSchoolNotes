// Exports tasks as an iCalendar (.ics) file. Importing it into Google Calendar,
// Apple Calendar, or Outlook drops each dated task in as an all-day event.
// (A live "subscribe" feed would need a hosted URL/backend — out of scope here;
// this is a one-time importable snapshot.)

function pad(n) {
  return String(n).padStart(2, '0')
}

// All-day iCal events use DATE values (no time). DTEND is exclusive, so a task
// due on its start day spans a single day: DTEND = due + 1 day.
function toIcsDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}${pad(m)}${pad(d)}`
}

function addOneDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + 1)
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Builds the VCALENDAR string. Pure + testable (no DOM). Only tasks with at
// least one date are exportable; a task with just one date is a single day.
export function buildTasksIcs(tasks, { now = new Date() } = {}) {
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours(),
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LawSchoolNotes//Tasks//EN', 'CALSCALE:GREGORIAN']

  for (const task of tasks) {
    const start = task.startDate || task.dueDate
    const end = task.dueDate || task.startDate
    if (!start) continue

    lines.push(
      'BEGIN:VEVENT',
      `UID:${task.id}@lawschoolnotes`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(start)}`,
      `DTEND;VALUE=DATE:${addOneDay(end)}`,
      `SUMMARY:${escapeText(task.title)}`,
    )
    if (task.description) lines.push(`DESCRIPTION:${escapeText(task.description)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadTasksAsIcs(tasks) {
  const ics = buildTasksIcs(tasks)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'tasks.ics'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
