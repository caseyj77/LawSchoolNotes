<script setup>
import { computed, onMounted, ref } from 'vue'
import { VueCal } from 'vue-cal'
import 'vue-cal/style.css'

import { useTasksStore } from '@/stores/tasksStore'

const tasksStore = useTasksStore()
const isLoading = ref(true)

onMounted(async () => {
  await tasksStore.fetchTasks()
  isLoading.value = false
})

// Only tasks with a due date are plottable — a task with just a start date
// and no due date has no end of the range to anchor an event to.
const events = computed(() =>
  tasksStore.tasks
    .filter((task) => task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      start: task.startDate || task.dueDate,
      end: task.dueDate,
      allDay: true,
      class: `task-event-${task.status}`,
    })),
)
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-wide">
      <div class="panel-header">
        <p class="label">Calendar</p>
        <h2>See start and due dates at a glance.</h2>
        <p class="supporting-copy">
          Tasks with a due date show up here — add start and due dates from the Tasks board.
        </p>
      </div>

      <p v-if="isLoading" class="supporting-copy">Loading calendar…</p>

      <div v-else class="calendar-wrapper">
        <VueCal :events="events" view="month" :views-bar="false" />
      </div>
    </article>
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

.supporting-copy {
  max-width: 42rem;
  margin: 0;
  line-height: 1.65;
}

.calendar-wrapper {
  height: 65vh;
  min-height: 28rem;
}

.calendar-wrapper :deep(.task-event-todo) {
  background-color: var(--color-accent);
}

.calendar-wrapper :deep(.task-event-in_progress) {
  background-color: var(--jungle-teal);
}

.calendar-wrapper :deep(.task-event-done) {
  background-color: var(--color-disabled);
}
</style>
