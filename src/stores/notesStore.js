import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { getCurrentUserId } from '@/lib/currentUser'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'
import { useActiveBriefStore } from '@/stores/activeBriefStore'

const CLASSES_STORAGE_KEY = 'law-school-classes'

const seedClasses = [
  {
    id: 'contracts',
    title: 'Contracts',
    focus: 'Formation, consideration, performance, and remedies.',
    outline: '',
  },
  {
    id: 'torts',
    title: 'Torts',
    focus: 'Intentional torts, negligence, strict liability, and defenses.',
    outline: '',
  },
  {
    id: 'civil-procedure',
    title: 'Civil Procedure',
    focus: 'Jurisdiction, pleading, discovery, and summary judgment.',
    outline: '',
  },
]

function loadClasses() {
  const stored = localStorage.getItem(CLASSES_STORAGE_KEY)
  if (!stored) return seedClasses

  try {
    return JSON.parse(stored)
  } catch {
    return seedClasses
  }
}

function shapeBrief(row, sectionRows, templateSections) {
  const keyByTemplateSectionId = new Map(templateSections.map((section) => [section.id, section.key]))
  const sections = {}
  for (const section of templateSections) sections[section.key] = ''
  for (const sectionRow of sectionRows.filter((sectionRow) => sectionRow.brief_id === row.id)) {
    const key = keyByTemplateSectionId.get(sectionRow.template_section_id)
    if (key) sections[key] = sectionRow.content
  }

  return {
    id: row.id,
    classId: row.class_id,
    templateId: row.template_id,
    caseName: row.case_name,
    citation: row.citation,
    studentNotes: row.student_notes,
    visibility: row.visibility,
    sections,
  }
}

export const useNotesStore = defineStore('notes', () => {
  const classes = ref(loadClasses())
  const caseBriefs = ref([])
  const templateSections = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  watch(
    classes,
    (value) => {
      localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  function addClass({ title, focus }) {
    const created = { id: crypto.randomUUID(), title, focus, outline: '' }
    classes.value.push(created)
    return created
  }

  function getClassById(id) {
    return classes.value.find((cls) => cls.id === id)
  }

  function updateOutline(classId, html) {
    const cls = getClassById(classId)
    if (!cls) return
    cls.outline = html
  }

  async function getTemplateSections(templateId = DEFAULT_TEMPLATE_ID) {
    if (templateSections.value.length) return templateSections.value

    const { data, error: dbError } = await supabase
      .from('template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('position')
    if (dbError) throw dbError

    templateSections.value = data
    return templateSections.value
  }

  function getBriefById(id) {
    return caseBriefs.value.find((brief) => brief.id === id) ?? null
  }

  function getBriefsForClass(classId) {
    return caseBriefs.value.filter((brief) => brief.classId === classId)
  }

  async function loadBriefsForClass(classId) {
    isLoading.value = true
    error.value = null
    try {
      const sections = await getTemplateSections()
      const userId = getCurrentUserId()

      const { data: briefRows, error: briefsError } = await supabase
        .from('case_briefs')
        .select('*')
        .eq('class_id', classId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (briefsError) throw briefsError

      const briefIds = briefRows.map((row) => row.id)
      let sectionRows = []
      if (briefIds.length) {
        const { data, error: sectionsError } = await supabase
          .from('brief_sections')
          .select('*')
          .in('brief_id', briefIds)
        if (sectionsError) throw sectionsError
        sectionRows = data
      }

      const loaded = briefRows.map((row) => shapeBrief(row, sectionRows, sections))
      caseBriefs.value = [...caseBriefs.value.filter((brief) => brief.classId !== classId), ...loaded]
      return loaded
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBriefById(id) {
    isLoading.value = true
    error.value = null
    try {
      const sections = await getTemplateSections()
      const userId = getCurrentUserId()

      const { data: rows, error: briefError } = await supabase
        .from('case_briefs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
      if (briefError) throw briefError

      const row = rows[0]
      if (!row) return null

      const { data: sectionRows, error: sectionsError } = await supabase
        .from('brief_sections')
        .select('*')
        .eq('brief_id', id)
      if (sectionsError) throw sectionsError

      const brief = shapeBrief(row, sectionRows, sections)
      caseBriefs.value = [...caseBriefs.value.filter((b) => b.id !== id), brief]
      return brief
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function createBlankBrief(classId) {
    const sections = await getTemplateSections()
    return {
      classId,
      templateId: DEFAULT_TEMPLATE_ID,
      caseName: '',
      citation: '',
      studentNotes: '',
      sections: Object.fromEntries(sections.map((section) => [section.key, ''])),
    }
  }

  async function saveCaseBrief(brief) {
    const sections = await getTemplateSections()
    const userId = getCurrentUserId()

    let briefId = brief.id
    if (!briefId) {
      const { data, error: insertError } = await supabase
        .from('case_briefs')
        .insert({
          user_id: userId,
          template_id: brief.templateId ?? DEFAULT_TEMPLATE_ID,
          class_id: brief.classId,
          case_name: brief.caseName ?? '',
          citation: brief.citation ?? '',
          student_notes: brief.studentNotes ?? '',
        })
        .select()
        .single()
      if (insertError) throw insertError
      briefId = data.id
    } else {
      const { error: updateError } = await supabase
        .from('case_briefs')
        .update({
          case_name: brief.caseName ?? '',
          citation: brief.citation ?? '',
          student_notes: brief.studentNotes ?? '',
        })
        .eq('id', briefId)
      if (updateError) throw updateError
    }

    for (const section of sections) {
      const { error: upsertError } = await supabase.from('brief_sections').upsert(
        {
          brief_id: briefId,
          template_section_id: section.id,
          user_id: userId,
          content: brief.sections?.[section.key] ?? '',
        },
        { onConflict: 'brief_id,template_section_id' },
      )
      if (upsertError) throw upsertError
    }

    const saved = { ...brief, id: briefId }
    caseBriefs.value = [...caseBriefs.value.filter((b) => b.id !== briefId), saved]
    useActiveBriefStore().setActiveBriefForClass(saved.classId, briefId)
    return saved
  }

  async function createAndSaveBrief({ classId, caseName }) {
    const blank = await createBlankBrief(classId)
    blank.caseName = caseName
    return saveCaseBrief(blank)
  }

  async function deleteClass(id) {
    classes.value = classes.value.filter((cls) => cls.id !== id)
    caseBriefs.value = caseBriefs.value.filter((brief) => brief.classId !== id)

    const { error: deleteError } = await supabase
      .from('case_briefs')
      .delete()
      .eq('class_id', id)
      .eq('user_id', getCurrentUserId())
    if (deleteError) throw deleteError
  }

  return {
    classes,
    caseBriefs,
    templateSections,
    isLoading,
    error,
    addClass,
    getClassById,
    updateOutline,
    deleteClass,
    getTemplateSections,
    getBriefsForClass,
    getBriefById,
    loadBriefsForClass,
    fetchBriefById,
    saveCaseBrief,
    createBlankBrief,
    createAndSaveBrief,
  }
})
