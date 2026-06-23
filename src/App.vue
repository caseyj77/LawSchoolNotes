<script setup>
import { RouterView } from 'vue-router'

import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader />

  <main class="app-shell">
    <section class="hero">
      <p class="eyebrow">Law School Notes</p>
      <h1>Organize course materials and build case briefs in one place.</h1>
      <p class="intro">
        Use the workspace to keep class outlines visible and draft briefs with the standard case
        sections you need for school.
      </p>
    </section>

    <RouterView />
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
}

:global(*) {
  box-sizing: border-box;
}

:global(a) {
  color: inherit;
}

.app-shell {
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
}

.hero {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-accent);
}

h1 {
  margin: 0;
  max-width: 12ch;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  line-height: 0.98;
}

.intro {
  max-width: 45rem;
  margin: 1rem 0 0;
  font-size: 1.05rem;
  line-height: 1.7;
}
</style>
