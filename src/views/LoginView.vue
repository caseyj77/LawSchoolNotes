<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''
  isSubmitting.value = true
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) throw authError
    router.push('/')
  } catch (e) {
    error.value = e.message ?? 'Failed to log in.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-narrow">
      <p class="label">Log in</p>
      <h2>Welcome back.</h2>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          Email
          <input v-model.trim="email" type="email" required autocomplete="email">
        </label>
        <label>
          Password
          <input v-model="password" type="password" required autocomplete="current-password">
        </label>
        <p v-if="error" class="warning">{{ error }}</p>
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Logging in…' : 'Log in' }}
        </button>
      </form>

      <p class="supporting-copy">
        Don't have an account? <RouterLink to="/signup">Create one</RouterLink>
      </p>
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

.panel-narrow {
  max-width: 28rem;
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

.auth-form {
  display: grid;
  gap: 0.85rem;
}

.auth-form label {
  display: grid;
  gap: 0.4rem;
  font-weight: 600;
}

.auth-form input {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.9rem;
  font: inherit;
  background: var(--color-surface-alt);
}

.auth-form button {
  padding: 0.7rem 1.2rem;
  border: 1px solid var(--color-active-border);
  border-radius: 0.9rem;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font: inherit;
  cursor: pointer;
}

.auth-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.warning {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.7rem;
  background: var(--color-error-bg);
  color: var(--color-error);
}

.supporting-copy {
  margin: 0;
  line-height: 1.65;
}
</style>
