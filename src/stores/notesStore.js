import { defineStore } from 'pinia'
import { ref } from 'vue'

import { EMPTY_DOC } from '@/lib/renderRichText'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_BRIEF_SECTIONS, DEFAULT_TEMPLATE_NAME } from '@/lib/templates'
import { useAuthStore } from '@/stores/auth'

const OUTLINE_PERSIST_DEBOUNCE_MS = 600
const outlineDebounceTimers = new Map()

const seedCourses = [
  {
    title: 'Contracts',
    focus: 'Formation, consideration, performance, and remedies.',
    outline: EMPTY_DOC,
    color: '#4b3f72',
  },
  {
    title: 'Torts',
    focus: 'Intentional torts, negligence, strict liability, and defenses.',
    outline: EMPTY_DOC,
    color: '#417b5a',
  },
  {
    title: 'Civil Procedure',
    focus: 'Jurisdiction, pleading, discovery, and summary judgment.',
    outline: EMPTY_DOC,
    color: '#1f2041',
  },
]

function shapeCourse(row) {
  return {
    id: row.id,
    title: row.title,
    focus: row.focus,
    outline: row.outline,
    color: row.color,
    lastActiveBriefId: row.last_active_brief_id,
  }
}

function shapeBrief(row, sectionRows, templateSections) {
  const keyByTemplateSectionId = new Map(templateSections.map((section) => [section.id, section.key]))
  const sections = {}
  for (const section of templateSections) sections[section.key] = EMPTY_DOC
  for (const sectionRow of sectionRows.filter((sectionRow) => sectionRow.brief_id === row.id)) {
    const key = keyByTemplateSectionId.get(sectionRow.template_section_id)
    if (key) sections[key] = sectionRow.content
  }

  return {
    id: row.id,
    courseId: row.class_id,
    templateId: row.template_id,
    caseName: row.case_name,
    citation: row.citation,
    studentNotes: row.student_notes,
    visibility: row.visibility,
    sections,
  }
}

export const useNotesStore = defineStore('notes', () => {
  const authStore = useAuthStore()
  const courses = ref([])
  const caseBriefs = ref([])
  const templateSections = ref([])
  // The signed-in user's brief template id, resolved lazily by
  // getTemplateSections() and reused when creating/saving briefs.
  let defaultTemplateId = null
  const isLoading = ref(false)
  const error = ref(null)

  function getUserId() {
    const userId = authStore.user?.id
    if (!userId) throw new Error('No authenticated user — cannot access notes data while logged out.')
    return userId
  }

  async function fetchCourses() {
    isLoading.value = true
    error.value = null
    try {
      const userId = getUserId()
      const { data, error: dbError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')
      if (dbError) throw dbError

      if (data.length === 0) {
        const { data: seeded, error: seedError } = await supabase
          .from('classes')
          .insert(seedCourses.map((course) => ({ ...course, id: crypto.randomUUID(), user_id: userId })))
          .select()
        if (seedError) throw seedError
        courses.value = seeded.map(shapeCourse)
      } else {
        courses.value = data.map(shapeCourse)
      }
      return courses.value
    } catch (e) {
      error.value = e
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function addCourse({ title, focus, color }) {
    const id = crypto.randomUUID()
    const { data, error: insertError } = await supabase
      .from('classes')
      .insert({ id, user_id: getUserId(), title, focus: focus ?? '', outline: EMPTY_DOC, color: color || '#4b3f72' })
      .select()
      .single()
    if (insertError) throw insertError

    const created = shapeCourse(data)
    courses.value.push(created)
    return created
  }

  function getCourseById(id) {
    return courses.value.find((course) => course.id === id)
  }

  async function updateCourse(id, { title, focus, color }) {
    const { data, error: updateError } = await supabase
      .from('classes')
      .update({ title, focus: focus ?? '', color: color || '#4b3f72' })
      .eq('id', id)
      .eq('user_id', getUserId())
      .select()
      .single()
    if (updateError) throw updateError

    const updated = shapeCourse(data)
    const existing = getCourseById(id)
    if (existing) Object.assign(existing, updated)
    return updated
  }

  // Optimistic local mutate, persisted to Supabase on a debounce since this is
  // called on every keystroke via RichTextEditor's Tiptap onUpdate.
  function updateOutline(courseId, content) {
    const course = getCourseById(courseId)
    if (!course) return
    course.outline = content
    scheduleOutlinePersist(courseId)
  }

  function scheduleOutlinePersist(courseId) {
    clearTimeout(outlineDebounceTimers.get(courseId))
    outlineDebounceTimers.set(
      courseId,
      setTimeout(() => {
        outlineDebounceTimers.delete(courseId)
        persistOutline(courseId)
      }, OUTLINE_PERSIST_DEBOUNCE_MS),
    )
  }

  async function persistOutline(courseId) {
    const course = getCourseById(courseId)
    if (!course) return
    const { error: dbError } = await supabase
      .from('classes')
      .update({ outline: course.outline })
      .eq('id', courseId)
      .eq('user_id', getUserId())
    if (dbError) {
      error.value = dbError
      throw dbError
    }
  }

  function getActiveBriefForCourse(courseId) {
    return getCourseById(courseId)?.lastActiveBriefId ?? null
  }

  async function setActiveBriefForCourse(courseId, briefId) {
    const course = getCourseById(courseId)
    if (course) course.lastActiveBriefId = briefId
    const { error: dbError } = await supabase
      .from('classes')
      .update({ last_active_brief_id: briefId })
      .eq('id', courseId)
      .eq('user_id', getUserId())
    if (dbError) {
      error.value = dbError
      throw dbError
    }
  }

  // Resolves the signed-in user's brief template, provisioning it on first use.
  //
  // The default template + sections are owned per-user (RLS scopes every row to
  // auth.uid()), so there is no global seed an authenticated user can read — we
  // create their template the first time they need it. We also reconcile any
  // canonical sections that are missing, so users who were seeded an earlier
  // (smaller) set automatically gain newly added sections. Existing briefs show
  // those new sections as empty because shapeBrief defaults any section without
  // a saved row to an empty document.
  async function getTemplateSections() {
    if (templateSections.value.length) return templateSections.value
    const userId = getUserId()

    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (templatesError) throw templatesError

    let templateId = templates?.[0]?.id
    if (!templateId) {
      const { data: created, error: createTemplateError } = await supabase
        .from('templates')
        .insert({ user_id: userId, name: DEFAULT_TEMPLATE_NAME })
        .select('id')
        .single()
      if (createTemplateError) throw createTemplateError
      templateId = created.id
    }

    const fetchSections = () =>
      supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', templateId)
        .order('position', { ascending: true })

    let { data: sections, error: sectionsError } = await fetchSections()
    if (sectionsError) throw sectionsError

    const existingKeys = new Set((sections ?? []).map((section) => section.key))
    const missing = DEFAULT_BRIEF_SECTIONS.filter((section) => !existingKeys.has(section.key))
    if (missing.length) {
      const { error: insertError } = await supabase.from('template_sections').insert(
        missing.map((section) => ({
          template_id: templateId,
          user_id: userId,
          label: section.label,
          key: section.key,
          placeholder: section.placeholder,
          position: section.position,
        })),
      )
      if (insertError) throw insertError
      ;({ data: sections, error: sectionsError } = await fetchSections())
      if (sectionsError) throw sectionsError
    }

    // Reconcile order/labels for users whose sections were created against an
    // earlier definition: missing sections are only inserted above, so a
    // reordering or relabel of an existing section has to be pushed here.
    const canonicalByKey = new Map(DEFAULT_BRIEF_SECTIONS.map((section) => [section.key, section]))
    for (const row of sections) {
      const canonical = canonicalByKey.get(row.key)
      if (!canonical) continue
      if (
        row.position === canonical.position &&
        row.label === canonical.label &&
        row.placeholder === canonical.placeholder
      ) {
        continue
      }
      const { error: updateError } = await supabase
        .from('template_sections')
        .update({
          position: canonical.position,
          label: canonical.label,
          placeholder: canonical.placeholder,
        })
        .eq('id', row.id)
      if (updateError) throw updateError
      Object.assign(row, {
        position: canonical.position,
        label: canonical.label,
        placeholder: canonical.placeholder,
      })
    }
    sections.sort((a, b) => a.position - b.position)

    defaultTemplateId = templateId
    templateSections.value = sections
    return templateSections.value
  }

  function getBriefById(id) {
    return caseBriefs.value.find((brief) => brief.id === id) ?? null
  }

  function getBriefsForCourse(courseId) {
    return caseBriefs.value.filter((brief) => brief.courseId === courseId)
  }

  async function loadBriefsForCourse(courseId) {
    isLoading.value = true
    error.value = null
    try {
      const sections = await getTemplateSections()
      const userId = getUserId()

      const { data: briefRows, error: briefsError } = await supabase
        .from('case_briefs')
        .select('*')
        .eq('class_id', courseId)
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
      caseBriefs.value = [...caseBriefs.value.filter((brief) => brief.courseId !== courseId), ...loaded]
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
      const userId = getUserId()

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

  async function createBlankBrief(courseId) {
    const sections = await getTemplateSections()
    return {
      courseId,
      templateId: defaultTemplateId,
      caseName: '',
      citation: '',
      studentNotes: '',
      sections: Object.fromEntries(sections.map((section) => [section.key, EMPTY_DOC])),
    }
  }

  async function saveCaseBrief(brief) {
    const sections = await getTemplateSections()
    const userId = getUserId()

    let briefId = brief.id
    if (!briefId) {
      const { data, error: insertError } = await supabase
        .from('case_briefs')
        .insert({
          user_id: userId,
          template_id: brief.templateId ?? defaultTemplateId,
          class_id: brief.courseId,
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
          content: brief.sections?.[section.key] ?? EMPTY_DOC,
        },
        { onConflict: 'brief_id,template_section_id' },
      )
      if (upsertError) throw upsertError
    }

    const saved = { ...brief, id: briefId }
    caseBriefs.value = [...caseBriefs.value.filter((b) => b.id !== briefId), saved]
    await setActiveBriefForCourse(saved.courseId, briefId)
    return saved
  }

  async function createAndSaveBrief({ courseId, caseName }) {
    const blank = await createBlankBrief(courseId)
    blank.caseName = caseName
    return saveCaseBrief(blank)
  }

  // Append ProseMirror/Tiptap `nodes` to the end of one brief section and
  // persist just that section. Used by the reader's "send to case brief" flow,
  // which (unlike the brief builder) has no save button — without this the
  // capture would only live in the open editor and be lost on reload. Works for
  // any brief, including one that isn't currently open (no mounted editor): the
  // reactive section update is reflected live by RichTextEditor's modelValue
  // watch when the brief is open, and simply persisted when it isn't.
  async function appendToBriefSection({ briefId, sectionKey, nodes }) {
    const brief = getBriefById(briefId)
    if (!brief) throw new Error('Cannot append to a brief that is not loaded.')

    const sections = await getTemplateSections()
    const templateSection = sections.find((section) => section.key === sectionKey)
    if (!templateSection) throw new Error(`Unknown brief section: ${sectionKey}`)

    const current = brief.sections[sectionKey] ?? EMPTY_DOC
    const nextContent = {
      type: current.type ?? 'doc',
      content: [...(current.content ?? []), ...nodes],
    }
    brief.sections[sectionKey] = nextContent

    const { error: upsertError } = await supabase.from('brief_sections').upsert(
      {
        brief_id: briefId,
        template_section_id: templateSection.id,
        user_id: getUserId(),
        content: nextContent,
      },
      { onConflict: 'brief_id,template_section_id' },
    )
    if (upsertError) {
      error.value = upsertError
      throw upsertError
    }
    return nextContent
  }

  async function deleteCourse(id) {
    courses.value = courses.value.filter((course) => course.id !== id)
    caseBriefs.value = caseBriefs.value.filter((brief) => brief.courseId !== id)

    const { error: deleteError } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .eq('user_id', getUserId())
    if (deleteError) throw deleteError
  }

  return {
    courses,
    caseBriefs,
    templateSections,
    isLoading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    getCourseById,
    updateOutline,
    persistOutline,
    getActiveBriefForCourse,
    setActiveBriefForCourse,
    deleteCourse,
    getTemplateSections,
    getBriefsForCourse,
    getBriefById,
    loadBriefsForCourse,
    fetchBriefById,
    saveCaseBrief,
    createBlankBrief,
    createAndSaveBrief,
    appendToBriefSection,
  }
})
