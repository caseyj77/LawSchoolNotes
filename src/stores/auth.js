import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const session = ref(null)

  async function signUpWithEmail(email, password) {
    return await supabase.auth.signUp({ email, password })
  }

  async function signInWithEmail(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signInWithGoogle() {
    return await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Fetches the current session synchronously so the router guard never sees a
  // false "logged out" state on first load, then keeps it in sync going forward.
  async function initAuthListener() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  return { user, session, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, initAuthListener }
})
