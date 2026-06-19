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
  border: 1px solid #e7e5e4;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
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
  color: #92400e;
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
  border: 1px solid #d6d3d1;
  border-radius: 0.9rem;
  font: inherit;
  background: #fffdfb;
}

.auth-form button {
  padding: 0.7rem 1.2rem;
  border: 1px solid #1f2937;
  border-radius: 0.9rem;
  background: #1f2937;
  color: #fff;
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
  background: #fef2f2;
  color: #b91c1c;
}

.supporting-copy {
  margin: 0;
  line-height: 1.65;
}
</style>
