---
name: vue3-app-builder
description: Use this skill whenever building, scaffolding, modifying, or debugging a Vue 3 web app for the user — including anything involving Vue components, Vue Router, Pinia stores, or general frontend project setup. Trigger this even if the user just says "build me a web app," "add a page," "add a store," or describes a feature without explicitly naming Vue, since Vue 3 + Pinia + Vue Router is the user's default stack for all personal/side-project web apps.
---

# Vue 3 App Builder

This skill captures the user's default conventions for building web apps, so every new project starts from the same baseline instead of re-deriving structure and style from scratch.

**About the user:** Builds web apps as a side project (not their primary profession). Prefers Vue 3 specifically because they understand how routing and state management fit together — so keep explanations grounded in that mental model when something deviates from convention, rather than assuming deep framework jargon.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Vue 3, Composition API, `<script setup>` | Not Options API — keep all new components in this style |
| Routing | Vue Router 4 | |
| State | Pinia | Use the `setup store` syntax (function-based), not the Options-style `defineStore` |
| Build tool | Vite | ASSUMPTION — standard pairing with Vue 3. Flag if you use something else. |
| Styling | Plain CSS / scoped `<style>` blocks | ASSUMPTION — no framework specified. Swap to Tailwind, UnoCSS, etc. if preferred. |
| Backend | Supabase | Auth (email/password + Google OAuth), database, and storage all via Supabase |
| Testing | None specified yet | ASSUMPTION — add Vitest + Vue Test Utils here once testing conventions are decided. |
| Package manager | npm | ASSUMPTION — swap to pnpm/yarn if preferred. |

## Project Structure

Default a new project to this layout unless the user's existing project already has a different one (in which case, match the existing project — never restructure an existing app to fit this template):

```
src/
├── assets/          # static files, global styles
├── components/      # reusable, presentational components
├── views/           # route-level components (one per page/route)
├── router/
│   └── index.js     # route definitions
├── stores/          # one Pinia store per domain concept
├── composables/      # reusable composition functions (useXyz.js)
├── App.vue
└── main.js
```

## Routing Conventions (Vue Router)

- Route-level components live in `views/`, named `XyzView.vue` (e.g. `LoginView.vue`, `DashboardView.vue`).
- Define routes in `router/index.js` using lazy-loaded imports for anything beyond the landing page, to keep initial bundle size down:
  ```js
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue')
  }
  ```
- Use named routes (not just paths) so links/redirects use `{ name: 'dashboard' }` rather than hardcoded path strings — this avoids breakage if a path changes later.
- Route guards (auth checks, etc.) go in `router/index.js` via `router.beforeEach`, not scattered inside individual components.

## Backend & Auth Conventions (Supabase)

- Initialize the Supabase client once, in `src/lib/supabase.js`, and import it everywhere else — never instantiate a second client:
  ```js
  // src/lib/supabase.js
  import { createClient } from '@supabase/supabase-js'

  export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
  ```
- Keys go in a `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the `VITE_` prefix is required for Vite to expose them to client code). Always add `.env` to `.gitignore` — never commit Supabase keys.
- **Auth lives in the `useAuthStore` Pinia store**, not scattered across components. The store wraps both sign-in methods and tracks the current session:
  ```js
  // stores/auth.js
  import { defineStore } from 'pinia'
  import { ref } from 'vue'
  import { supabase } from '../lib/supabase'

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

    // Call this once, e.g. in App.vue's onMounted, to keep the store in sync
    function initAuthListener() {
      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        user.value = newSession?.user ?? null
      })
    }

    return { user, session, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, initAuthListener }
  })
  ```
- **Route guards check `session.value`** via the auth store in `router.beforeEach`, redirecting unauthenticated users away from protected routes (e.g. to a `login` named route).
- **Row Level Security (RLS):** any Supabase table holding user data should have RLS policies enabled — don't rely on client-side checks alone to protect data. If a new table is added, flag this so RLS gets set up rather than assuming it's on by default (Supabase tables start with RLS disabled).
- For Google OAuth specifically, the user will need the Google provider configured in the Supabase dashboard (Authentication → Providers) with a redirect URL set — this is a one-time per-project setup step worth reminding them about on a fresh project, since it's easy to forget and causes a silent redirect failure.

## State Management (Pinia) Conventions

- One store per domain concept (`useAuthStore`, `useCartStore`) — avoid one giant catch-all store.
- Use the function-based "setup store" syntax, since it mirrors `<script setup>` and keeps state/getters/actions readable as plain `ref`/`computed`/functions:
  ```js
  // stores/cart.js
  import { defineStore } from 'pinia'
  import { ref, computed } from 'vue'

  export const useCartStore = defineStore('cart', () => {
    const items = ref([])
    const total = computed(() => items.value.reduce((sum, i) => sum + i.price, 0))

    function addItem(item) {
      items.value.push(item)
    }

    return { items, total, addItem }
  })
  ```
  (See "Backend & Auth Conventions" above for the actual `useAuthStore` shape — auth has its own dedicated pattern since it wraps Supabase.)
- Components access stores via `const authStore = useAuthStore()` inside `<script setup>`, never by importing state directly.

## Component Conventions

- `<script setup>` first, then `<template>`, then `<style scoped>` — keep this order consistent.
- Component file names: PascalCase (`UserCard.vue`).
- Props: declare with `defineProps` and explicit types, not just a bare array of names, so the AI (and future-you) knows the expected shape at a glance:
  ```js
  defineProps({
    user: { type: Object, required: true }
  })
  ```
- Prefer small, single-purpose components over large ones with many responsibilities — if a component file is doing more than one clear job, that's a signal to split it.

## Styling Gotchas

- **Native `<button>` text/border color doesn't inherit from `body`, and can vanish under OS dark mode.** Browsers' UA stylesheet gives `<button>` a default `color: buttontext` (a system color keyword) — this does *not* inherit the page's `color`, even if you set one on `body`. `buttontext`/`buttonface` resolve differently depending on whether the OS/browser is in light or dark mode. If a button rule sets a custom `background` (e.g. white) but never sets an explicit `color`, the text is invisible (white-on-white) for any user whose system is in dark mode — while buttons that *do* set `color` explicitly (active/toggle states, etc.) render fine, making the bug easy to miss in your own light-mode dev environment.
  - **Fix, two parts:**
    1. Add `color-scheme: light` to the global `body` rule (next to wherever `color`/`background` are set) for any app that's light-mode-only (no dark theme variant) — this opts the page out of the browser's automatic system-color swapping entirely.
    2. Still explicitly set `color: var(--color-text)` (or whatever the theme's text variable is) on every custom button rule, rather than relying on inheritance — don't assume a button's text color "just works" because the surrounding text does. Treat `color-scheme: light` as the belt, explicit `color` per button as the suspenders.
  - This isn't limited to `<button>` — `<select>`, `<input>`, and other form controls have the same system-color-keyword defaults, so apply the same explicit-`color` discipline to those too.

## What to do when something isn't covered here

If a project needs something this skill doesn't specify yet (a backend choice, a UI library, a deployment target), don't silently invent a default and bury it in code — say so explicitly, suggest a sensible option, and ask whether to add it to this skill so future projects inherit the same answer.
