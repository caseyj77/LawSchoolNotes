// TEMPORARY: no auth system exists yet. All data is scoped to this single
// hardcoded user id so RLS policies are already shaped correctly.
// TODO(auth): replace with supabase.auth.getUser()?.id once Auth ships.
export const STUB_USER_ID = '00000000-0000-0000-0000-000000000001'

export function getCurrentUserId() {
  return STUB_USER_ID
}
