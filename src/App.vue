<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <main class="app-shell">
    <section class="hero">
      <p class="eyebrow">Law School Notes</p>
      <h1>Organize course materials and build case briefs in one place.</h1>
      <p class="intro">
        Use the workspace to keep class outlines visible and draft briefs with the standard case
        sections you need for school.
      </p>
      <nav class="nav">
        <RouterLink to="/">Classes</RouterLink>
      </nav>
    </section>

    <RouterView />
  </main>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family:
    Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f1eb;
  color: #1f2937;
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
  color: #92400e;
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

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.nav a {
  padding: 0.8rem 1.15rem;
  border: 1px solid #d6d3d1;
  border-radius: 999px;
  text-decoration: none;
  background: #fff;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.nav a.router-link-active {
  background: #1f2937;
  border-color: #1f2937;
  color: #fff;
}
</style>
