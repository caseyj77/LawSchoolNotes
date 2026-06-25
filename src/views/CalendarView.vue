<script setup>
import { computed, onMounted, reactive, ref, watchEffect } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import multiMonthPlugin from '@fullcalendar/multimonth'
import interactionPlugin from '@fullcalendar/interaction'

import TaskFormModal from '@/components/TaskFormModal.vue'
import { downloadTasksAsIcs } from '@/lib/exportTasksToIcs'
import { STATUS_META, eventToDates, isTaskOverdue, taskHasSchedule, taskToEvent } from '@/lib/taskCalendar'
import { TASK_STATUSES, useTasksStore } from '@/stores/tasksStore'
import { useNotesStore } from '@/stores/notesStore'

const tasksStore = useTasksStore()
const notesStore = useNotesStore()
const isLoading = ref(true)

const colorMode = ref('status') // 'status' | 'course'
const courseFilter = ref('')
const statusFilter = ref('')
const tagFilter = ref('')

onMounted(async () => {
  await Promise.all([tasksStore.fetchTasks(), notesStore.fetchCourses()])
  isLoading.value = false
})

function taskById(id) {
  return tasksStore.tasks.find((task) => task.id === id) ?? null
}

function courseColor(courseId) {
  return notesStore.getCourseById(courseId)?.color ?? null
}

const filteredTasks = computed(() =>
  tasksStore.tasks.filter((task) => {
    if (courseFilter.value && task.courseId !== courseFilter.value) return false
    if (statusFilter.value && task.status !== statusFilter.value) return false
    if (tagFilter.value) {
      const query = tagFilter.value.toLowerCase()
      if (!task.tags.some((tag) => tag.toLowerCase().includes(query))) return false
    }
    return true
  }),
)

const unscheduledTasks = computed(() => filteredTasks.value.filter((task) => !taskHasSchedule(task)))

// In Course mode the bar always shows its course color. In Status mode an
// overdue task turns red so a missed deadline stands out.
function barColor(task) {
  if (!task) return 'var(--color-accent)'
  if (colorMode.value === 'course') return courseColor(task.courseId) ?? '#4b3f72'
  if (isTaskOverdue(task)) return '#b91c1c'
  return STATUS_HEX[task.status] ?? '#4b3f72'
}

// FullCalendar needs concrete colors (not CSS vars) for event backgrounds.
const STATUS_HEX = { todo: '#4b3f72', in_progress: '#417b5a', done: '#9d9a86' }

const legendItems = computed(() => {
  if (colorMode.value === 'course') {
    return notesStore.courses.map((course) => ({ label: course.title, color: course.color }))
  }
  return TASK_STATUSES.map((status) => ({ label: STATUS_META[status].label, color: STATUS_HEX[status] }))
})

const mappedEvents = computed(() =>
  filteredTasks.value.filter(taskHasSchedule).map((task) => {
    const base = taskToEvent(task) // { start: Date, end: Date (exclusive), allDay }
    const color = barColor(task)
    return {
      id: base.id,
      title: base.title,
      start: base.start,
      end: base.end,
      allDay: true,
      backgroundColor: color,
      borderColor: color,
      textColor: '#fff',
    }
  }),
)

// --- Drag / resize: persist the new dates -----------------------------------
function handleEventDrop(info) {
  const { startDate, dueDate } = eventToDates(info.event)
  tasksStore.updateTaskSchedule(info.event.id, { startDate, dueDate }).catch(() => info.revert())
}

function handleEventResize(info) {
  const { startDate, dueDate } = eventToDates(info.event)
  tasksStore.updateTaskSchedule(info.event.id, { startDate, dueDate }).catch(() => info.revert())
}

// --- Double-click to edit (a bar) / create (an empty day) -------------------
let lastEventClick = { id: '', at: 0 }
function handleEventClick(info) {
  const now = Date.now()
  if (lastEventClick.id === info.event.id && now - lastEventClick.at < 350) {
    openEdit(taskById(info.event.id))
    lastEventClick = { id: '', at: 0 }
  } else {
    lastEventClick = { id: info.event.id, at: now }
  }
}

let lastDateClick = { date: '', at: 0 }
function handleDateClick(info) {
  const now = Date.now()
  if (lastDateClick.date === info.dateStr && now - lastDateClick.at < 350) {
    openCreate({ startDate: info.dateStr, dueDate: info.dateStr })
    lastDateClick = { date: '', at: 0 }
  } else {
    lastDateClick = { date: info.dateStr, at: now }
  }
}

// Native hover tooltip with the task's details (no clipping issues inside cells).
function handleEventDidMount(info) {
  const task = taskById(info.event.id)
  if (!task) return
  const parts = [task.title]
  if (task.description) parts.push(task.description)
  const course = notesStore.getCourseById(task.courseId)?.title
  if (course) parts.push(course)
  if (task.tags.length) parts.push(task.tags.map((tag) => `#${tag}`).join(' '))
  info.el.title = parts.join('\n')
}

async function toggleDone(task) {
  if (!task) return
  await tasksStore.setTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')
}

const calendarOptions = reactive({
  plugins: [dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: '100%',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'timeGridDay,timeGridWeek,dayGridMonth,multiMonthThree,multiMonthSix,multiMonthYear',
  },
  views: {
    timeGridDay: { buttonText: 'Day' },
    timeGridWeek: { buttonText: 'Week' },
    dayGridMonth: { buttonText: 'Month' },
    multiMonthThree: { type: 'multiMonth', duration: { months: 3 }, buttonText: '3 mo' },
    multiMonthSix: { type: 'multiMonth', duration: { months: 6 }, buttonText: '6 mo' },
    multiMonthYear: { buttonText: '12 mo' },
  },
  editable: true,
  eventStartEditable: true,
  eventDurationEditable: true,
  dayMaxEvents: true,
  navLinks: true,
  events: [],
  eventDrop: handleEventDrop,
  eventResize: handleEventResize,
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  eventDidMount: handleEventDidMount,
})

watchEffect(() => {
  calendarOptions.events = mappedEvents.value
})

// --- Task editor modal ------------------------------------------------------
const isModalOpen = ref(false)
const modalTask = ref(null)
const modalPreset = ref(null)

function openCreate(preset = null) {
  modalTask.value = null
  modalPreset.value = preset
  isModalOpen.value = true
}

function openEdit(task) {
  if (!task) return
  modalTask.value = task
  modalPreset.value = null
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  modalTask.value = null
  modalPreset.value = null
}

async function handleModalSubmit({ id, values }) {
  if (id) {
    await tasksStore.updateTask(id, values)
  } else {
    await tasksStore.addTask(values)
  }
  closeModal()
}

async function handleModalDelete(id) {
  await tasksStore.deleteTask(id)
  closeModal()
}

function exportIcs() {
  downloadTasksAsIcs(tasksStore.tasks)
}
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="label">Calendar</p>
          <h2>Drag, resize, and schedule every deadline.</h2>
        </div>
        <div class="header-buttons">
          <button type="button" class="ghost-button" @click="exportIcs">Export .ics</button>
          <button type="button" class="add-task-button" @click="openCreate()">+ New task</button>
        </div>
      </div>

      <p v-if="isLoading" class="supporting-copy">Loading calendar…</p>

      <template v-else>
        <div class="toolbar">
          <div class="color-toggle">
            <span class="toolbar-label">Color by</span>
            <button type="button" :class="{ active: colorMode === 'status' }" @click="colorMode = 'status'">
              Status
            </button>
            <button type="button" :class="{ active: colorMode === 'course' }" @click="colorMode = 'course'">
              Course
            </button>
          </div>

          <div class="filters">
            <select v-model="courseFilter" aria-label="Filter by course">
              <option value="">All courses</option>
              <option v-for="course in notesStore.courses" :key="course.id" :value="course.id">
                {{ course.title }}
              </option>
            </select>
            <select v-model="statusFilter" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option v-for="status in TASK_STATUSES" :key="status" :value="status">
                {{ STATUS_META[status].label }}
              </option>
            </select>
            <input v-model.trim="tagFilter" type="text" placeholder="Filter by tag" aria-label="Filter by tag">
          </div>
        </div>

        <div class="legend">
          <span v-for="item in legendItems" :key="item.label" class="legend-item">
            <span class="legend-swatch" :style="{ background: item.color || 'var(--color-border-strong)' }"></span>
            {{ item.label }}
          </span>
          <span v-if="colorMode === 'status'" class="legend-item">
            <span class="legend-swatch" style="background: #b91c1c"></span>
            Overdue
          </span>
        </div>

        <div class="calendar-layout">
          <div class="calendar-wrapper">
            <FullCalendar :options="calendarOptions">
              <template #eventContent="arg">
                <div class="fc-task-bar">
                  <button
                    type="button"
                    class="fc-done"
                    :aria-label="taskById(arg.event.id)?.status === 'done' ? 'Mark not done' : 'Mark done'"
                    @mousedown.stop
                    @click.stop="toggleDone(taskById(arg.event.id))"
                  >
                    {{ taskById(arg.event.id)?.status === 'done' ? '✓' : '○' }}
                  </button>
                  <span class="fc-task-title">{{ arg.event.title }}</span>
                </div>
              </template>
            </FullCalendar>
          </div>

          <aside class="unscheduled">
            <p class="unscheduled-label">Unscheduled ({{ unscheduledTasks.length }})</p>
            <p v-if="!unscheduledTasks.length" class="unscheduled-empty">Every task has a date. 🎉</p>
            <button
              v-for="task in unscheduledTasks"
              :key="task.id"
              type="button"
              class="unscheduled-item"
              @click="openEdit(task)"
            >
              <span
                class="unscheduled-dot"
                :style="{ background: courseColor(task.courseId) || 'var(--color-border-strong)' }"
              ></span>
              {{ task.title }}
              <span class="unscheduled-cta">Schedule</span>
            </button>
          </aside>
        </div>
      </template>
    </article>

    <TaskFormModal
      v-if="isModalOpen"
      :task="modalTask"
      :preset-dates="modalPreset"
      :courses="notesStore.courses"
      @submit="handleModalSubmit"
      @delete="handleModalDelete"
      @close="closeModal"
    />
  </section>
</template>

<style scoped>
.content-grid {
  display: grid;
}

.panel {
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  background: var(--color-panel-bg);
  box-shadow: 0 18px 45px var(--shadow-color-light);
}

.panel-wide {
  display: grid;
  gap: 1rem;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.label {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent);
}

h2 {
  margin: 0;
  font-size: 1.8rem;
}

.header-buttons {
  display: flex;
  gap: 0.6rem;
}

.add-task-button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 999px;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.ghost-button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.ghost-button:hover {
  background: var(--color-bg-alt);
}

.supporting-copy {
  max-width: 42rem;
  margin: 0;
  line-height: 1.65;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.color-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.toolbar-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.color-toggle button {
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.color-toggle button.active {
  background: var(--color-active-bg);
  border-color: var(--color-active-border);
  color: var(--color-active-text);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filters select,
.filters input {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.7rem;
  font: inherit;
  font-size: 0.85rem;
  background: var(--color-surface-alt);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 0.25rem;
}

.calendar-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 15rem;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 900px) {
  .calendar-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.calendar-wrapper {
  height: 72vh;
  min-height: 30rem;
}

/* Theme FullCalendar with the app's palette via its CSS custom properties. */
.calendar-wrapper :deep(.fc) {
  --fc-border-color: var(--color-border);
  --fc-page-bg-color: var(--color-surface);
  --fc-neutral-bg-color: var(--color-bg-alt);
  --fc-today-bg-color: rgba(75, 63, 114, 0.08);
  --fc-button-bg-color: var(--color-surface);
  --fc-button-border-color: var(--color-border-strong);
  --fc-button-text-color: var(--color-text);
  --fc-button-hover-bg-color: var(--color-bg-alt);
  --fc-button-hover-border-color: var(--color-border-strong);
  --fc-button-active-bg-color: var(--color-active-bg);
  --fc-button-active-border-color: var(--color-active-border);
  font-family: inherit;
}

.calendar-wrapper :deep(.fc .fc-button) {
  border-radius: 0.6rem;
  font-weight: 600;
  text-transform: capitalize;
  box-shadow: none;
}

.calendar-wrapper :deep(.fc .fc-button-primary:not(:disabled).fc-button-active) {
  color: var(--color-active-text);
}

.calendar-wrapper :deep(.fc .fc-toolbar-title) {
  font-size: 1.2rem;
  font-weight: 700;
}

.calendar-wrapper :deep(.fc .fc-daygrid-day.fc-day-today),
.calendar-wrapper :deep(.fc .fc-timegrid-col.fc-day-today) {
  background: var(--fc-today-bg-color);
}

.fc-task-bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  padding: 0 0.15rem;
}

.fc-done {
  flex-shrink: 0;
  width: 1.05rem;
  height: 1.05rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  color: #fff;
  font-size: 0.68rem;
  line-height: 1;
  cursor: pointer;
}

.fc-task-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.unscheduled {
  display: grid;
  gap: 0.5rem;
  align-content: start;
  padding: 1rem;
  border-radius: 1rem;
  background: var(--color-bg-alt);
}

.unscheduled-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
}

.unscheduled-empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.unscheduled-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.6rem;
  border: none;
  border-radius: 0.6rem;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
}

.unscheduled-item:hover {
  box-shadow: 0 6px 16px var(--shadow-color-light);
}

.unscheduled-dot {
  flex-shrink: 0;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
}

.unscheduled-cta {
  margin-left: auto;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-accent);
}
</style>
