import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'law-school-notes'

const seedClasses = [
  {
    id: 'contracts',
    title: 'Contracts',
    focus: 'Formation, consideration, performance, and remedies.',
  },
  {
    id: 'torts',
    title: 'Torts',
    focus: 'Intentional torts, negligence, strict liability, and defenses.',
  },
  {
    id: 'civil-procedure',
    title: 'Civil Procedure',
    focus: 'Jurisdiction, pleading, discovery, and summary judgment.',
  },
]

const CLASSES_STORAGE_KEY = 'law-school-classes'

function loadCaseBriefs() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

function loadClasses() {
  const stored = localStorage.getItem(CLASSES_STORAGE_KEY)
  if (!stored) return seedClasses

  try {
    return JSON.parse(stored)
  } catch {
    return seedClasses
  }
}

export const useNotesStore = defineStore('notes', () => {
  const classes = ref(loadClasses())
  const caseBriefs = ref(loadCaseBriefs())

  watch(
    caseBriefs,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  watch(
    classes,
    (value) => {
      localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addClass({ title, focus }) {
    const created = { id: crypto.randomUUID(), title, focus }
    classes.value.push(created)
    return created
  }

  function getClassById(id) {
    return classes.value.find((cls) => cls.id === id)
  }

  function getBriefsForClass(classId) {
    return caseBriefs.value.filter((brief) => brief.classId === classId)
  }

  function getBriefById(id) {
    return caseBriefs.value.find((brief) => brief.id === id)
  }

  function saveCaseBrief(brief) {
    if (!brief.id) {
      brief.id = crypto.randomUUID()
      caseBriefs.value.push(brief)
      return
    }

    const existing = getBriefById(brief.id)
    Object.assign(existing, brief)
  }

  function createBlankBrief(classId) {
    return {
      classId,
      caseName: '',
      citation: '',
      facts: '',
      issue: '',
      rule: '',
      analysis: '',
      conclusion: '',
      studentNotes: '',
    }
  }

  return {
    classes,
    caseBriefs,
    addClass,
    getClassById,
    getBriefsForClass,
    getBriefById,
    saveCaseBrief,
    createBlankBrief,
  }
})
