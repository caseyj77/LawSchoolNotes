import { getCurrentUserId } from '@/lib/currentUser'
import { supabase } from '@/lib/supabaseClient'
import { DEFAULT_TEMPLATE_ID } from '@/lib/templates'

const LEGACY_STORAGE_KEY = 'law-school-notes'
const MIGRATION_FLAG_KEY = 'law-school-notes-migrated-to-supabase'

export async function migrateLocalBriefsToSupabase(templateSections) {
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return { migrated: 0 }

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
  const legacyBriefs = raw ? JSON.parse(raw) : []
  if (legacyBriefs.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
    return { migrated: 0 }
  }

  const userId = getCurrentUserId()

  for (const legacy of legacyBriefs) {
    const { data: insertedBrief, error: insertError } = await supabase
      .from('case_briefs')
      .insert({
        user_id: userId,
        template_id: DEFAULT_TEMPLATE_ID,
        class_id: legacy.classId,
        case_name: legacy.caseName ?? '',
        citation: legacy.citation ?? '',
        student_notes: legacy.studentNotes ?? '',
      })
      .select()
      .single()
    if (insertError) throw insertError

    const sectionRows = templateSections.map((section) => ({
      brief_id: insertedBrief.id,
      template_section_id: section.id,
      user_id: userId,
      content: legacy[section.key] ?? '',
    }))
    const { error: sectionsError } = await supabase.from('brief_sections').insert(sectionRows)
    if (sectionsError) throw sectionsError
  }

  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
  return { migrated: legacyBriefs.length }
}
