import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'law-school-active-briefs'

function loadLastActiveBriefByClass() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}

  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export const useActiveBriefStore = defineStore('activeBrief', () => {
  const lastActiveBriefByClass = ref(loadLastActiveBriefByClass())

  watch(
    lastActiveBriefByClass,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function getActiveBriefForClass(classId) {
    return lastActiveBriefByClass.value[classId] ?? null
  }

  function setActiveBriefForClass(classId, briefId) {
    lastActiveBriefByClass.value[classId] = briefId
  }

  return {
    lastActiveBriefByClass,
    getActiveBriefForClass,
    setActiveBriefForClass,
  }
})
