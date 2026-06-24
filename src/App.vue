<script setup>
import { RouterView } from 'vue-router'

import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div v-if="authStore.session" class="app-layout">
    <AppSidebar />
    <main class="app-content">
      <RouterView />
    </main>
  </div>

  <div v-else class="public-shell">
    <p class="public-brand">Law School Notes</p>
    <RouterView />
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  color-scheme: light;
}

:global(*) {
  box-sizing: border-box;
}

:global(a) {
  color: inherit;
}

.app-layout {
  min-height: 100vh;
}

.app-content {
  margin-left: var(--sidebar-width);
  max-width: 1100px;
  padding: 2.5rem 2rem;
}

@media (max-width: 900px) {
  .app-content {
    margin-left: 0;
    padding: 1.5rem;
  }
}

.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem 1.5rem;
}

.public-brand {
  margin: 0 0 2rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-text);
}
</style>
