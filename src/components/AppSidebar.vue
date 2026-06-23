<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const isOpen = ref(false)

function closeSidebar() {
  isOpen.value = false
}

function toggleSidebar() {
  isOpen.value = !isOpen.value
}

async function handleLogOut() {
  closeSidebar()
  await authStore.signOut()
  router.push({ name: 'login' })
}

function initials(email) {
  if (!email) return '?'
  return email.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="sidebar-shell">
    <header class="mobile-bar">
      <span class="brand">Law School Notes</span>
      <button
        type="button"
        class="menu-toggle"
        :aria-expanded="isOpen"
        aria-label="Toggle navigation menu"
        @click="toggleSidebar"
      >
        <span class="menu-toggle-bar"></span>
        <span class="menu-toggle-bar"></span>
        <span class="menu-toggle-bar"></span>
      </button>
    </header>

    <div v-if="isOpen" class="backdrop" @click="closeSidebar"></div>

    <aside class="sidebar" :class="{ open: isOpen }">
      <RouterLink :to="{ name: 'course-outlines' }" class="brand" @click="closeSidebar">
        Law School Notes
      </RouterLink>

      <nav class="nav">
        <RouterLink :to="{ name: 'course-outlines' }" class="nav-item" @click="closeSidebar">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 19.5V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v15M4 19.5A2.5 2.5 0 0 1 6.5 17H17M9 7h4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Classes
        </RouterLink>

        <RouterLink :to="{ name: 'tasks' }" class="nav-item" @click="closeSidebar">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 6.5h11M5 12h11M5 17.5h7M9 3.5l-2 2-1-1"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Tasks
        </RouterLink>

        <RouterLink :to="{ name: 'calendar' }" class="nav-item" @click="closeSidebar">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 9.5h14M7 4v3M17 4v3M6 6.5h12a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Calendar
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div class="user-card">
          <span class="avatar">{{ initials(authStore.user?.email) }}</span>
          <span class="user-email">{{ authStore.user?.email }}</span>
        </div>
        <button type="button" class="logout-button" @click="handleLogOut">Log out</button>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.mobile-bar {
  display: none;
}

.brand {
  display: block;
  padding: 0 1.5rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-text);
  text-decoration: none;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.75rem 0;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.75rem;
  color: var(--color-text);
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.nav-item:hover {
  background: var(--color-bg-alt);
}

.nav-item.router-link-active {
  background: var(--color-active-bg);
  color: var(--color-active-text);
}

.nav-icon {
  width: 1.15rem;
  height: 1.15rem;
  flex-shrink: 0;
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0 0.75rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: 0.85rem;
  background: var(--color-bg-alt);
}

.avatar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: var(--color-active-bg);
  color: var(--color-active-text);
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.user-email {
  overflow: hidden;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.logout-button {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 0.75rem;
  background: var(--color-surface);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.logout-button:hover {
  background: var(--color-bg-alt);
}

.backdrop {
  display: none;
}

@media (max-width: 900px) {
  .mobile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 40;
    padding: 1rem 1.5rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .mobile-bar .brand {
    padding: 0;
  }

  .menu-toggle {
    display: flex;
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

  .sidebar {
    z-index: 50;
    transform: translateX(-100%);
    box-shadow: 0 18px 45px var(--shadow-color-dark);
    transition: transform 0.2s ease;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar > .brand {
    display: none;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(0, 0, 0, 0.35);
  }
}
</style>
