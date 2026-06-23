<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const isMenuOpen = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

async function handleLogOut() {
  closeMenu()
  await authStore.signOut()
  router.push({ name: 'login' })
}

function initials(email) {
  if (!email) return '?'
  return email.slice(0, 2).toUpperCase()
}
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'course-outlines' }" class="brand" @click="closeMenu">
        Law School Notes
      </RouterLink>

      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="isMenuOpen"
        aria-label="Toggle navigation menu"
        @click="toggleMenu"
      >
        <span class="menu-toggle-bar"></span>
        <span class="menu-toggle-bar"></span>
        <span class="menu-toggle-bar"></span>
      </button>

      <div class="header-panel" :class="{ open: isMenuOpen }">
        <nav class="nav">
          <template v-if="authStore.session">
            <RouterLink :to="{ name: 'course-outlines' }" @click="closeMenu">Classes</RouterLink>
          </template>
          <template v-else>
            <RouterLink :to="{ name: 'login' }" @click="closeMenu">Log in</RouterLink>
            <RouterLink :to="{ name: 'signup' }" @click="closeMenu">Create account</RouterLink>
          </template>
        </nav>

        <div v-if="authStore.session" class="user-card">
          <span class="avatar">{{ initials(authStore.user?.email) }}</span>
          <span class="user-email">{{ authStore.user?.email }}</span>
          <button type="button" class="logout-button" @click="handleLogOut">Log out</button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
}

.brand {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
}

.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: 0.6rem;
  background: var(--color-surface);
  cursor: pointer;
}

.menu-toggle-bar {
  display: block;
  width: 1.1rem;
  height: 2px;
  margin: 0 auto;
  background: var(--color-text);
}

.header-panel {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.nav a {
  padding: 0.55rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  text-decoration: none;
  color: var(--color-text);
  white-space: nowrap;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.nav a.router-link-active {
  background: var(--color-active-bg);
  border-color: var(--color-active-border);
  color: var(--color-active-text);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.75rem 0.4rem 0.4rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-bg-alt);
}

.avatar {
  display: grid;
  place-items: center;
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-email {
  max-width: 12rem;
  overflow: hidden;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.logout-button {
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  background: var(--color-surface);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
}

.logout-button:hover {
  background: var(--color-bg-alt);
}

@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  .header-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    display: none;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1rem 1.5rem 1.25rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    box-shadow: 0 18px 45px var(--shadow-color-light);
  }

  .header-panel.open {
    display: flex;
  }

  .nav {
    flex-direction: column;
  }

  .nav a {
    text-align: center;
  }

  .user-card {
    justify-content: space-between;
  }

  .user-email {
    max-width: none;
    flex: 1;
  }
}
</style>
