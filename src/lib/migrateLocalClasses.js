import { getCurrentUserId } from '@/lib/currentUser'
import { supabase } from '@/lib/supabaseClient'

const CLASSES_STORAGE_KEY = 'law-school-classes'
const ACTIVE_BRIEFS_STORAGE_KEY = 'law-school-active-briefs'
const MIGRATION_FLAG_KEY = 'law-school-classes-migrated-to-supabase'

export async function migrateLocalClassesToSupabase() {
  if (localStorage.getItem(MIGRATION_FLAG_KEY)) return { migrated: 0 }

  const rawClasses = localStorage.getItem(CLASSES_STORAGE_KEY)
  const legacyClasses = rawClasses ? JSON.parse(rawClasses) : []
  if (legacyClasses.length === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
    return { migrated: 0 }
  }

  const rawActiveBriefs = localStorage.getItem(ACTIVE_BRIEFS_STORAGE_KEY)
  const legacyActiveBriefs = rawActiveBriefs ? JSON.parse(rawActiveBriefs) : {}
  const userId = getCurrentUserId()

  const rows = legacyClasses.map((cls) => ({
    id: cls.id,
    user_id: userId,
    title: cls.title,
    focus: cls.focus ?? '',
    outline: cls.outline ?? '',
    last_active_brief_id: legacyActiveBriefs[cls.id] ?? null,
  }))

  const { error } = await supabase.from('classes').upsert(rows, { onConflict: 'id' })
  if (error) throw error

  localStorage.setItem(MIGRATION_FLAG_KEY, 'true')
  return { migrated: rows.length }
}
