<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { supabase } from '@/lib/supabaseClient'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  error.value = ''
  successMessage.value = ''
  isSubmitting.value = true
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (authError) throw authError

    if (data.session) {
      router.push('/')
    } else {
      successMessage.value = 'Check your email to confirm your account before logging in.'
    }
  } catch (e) {
    error.value = e.message ?? 'Failed to create account.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="content-grid">
    <article class="panel panel-narrow">
      <p class="label">Create account</p>
      <h2>Get started.</h2>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          Email
          <input v-model.trim="email" type="email" required autocomplete="email">
        </label>
        <label>
          Password
          <input v-model="password" type="password" required minlength="6" autocomplete="new-password">
        </label>
        <p v-if="error" class="warning">{{ error }}</p>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
        <button type="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="supporting-copy">
        Already have an account? <RouterLink to="/login">Log in</RouterLink>
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

.success {
  margin: 0;
  padding: 0.6rem 0.85rem;
  border-radius: 0.7rem;
  background: var(--color-success-bg);
  color: var(--jungle-teal);
}

.supporting-copy {
  margin: 0;
  line-height: 1.65;
}
</style>
