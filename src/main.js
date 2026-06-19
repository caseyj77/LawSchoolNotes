import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { migrateLocalBriefsToSupabase } from './lib/migrateLocalBriefs'
import { migrateLocalClassesToSupabase } from './lib/migrateLocalClasses'
import { useNotesStore } from './stores/notesStore'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const notesStore = useNotesStore(pinia)

const briefsReady = notesStore
  .getTemplateSections()
  .then((sections) => migrateLocalBriefsToSupabase(sections))
  .catch((error) => console.error('Failed to migrate local case briefs to Supabase.', error))

const classesReady = migrateLocalClassesToSupabase()
  .catch((error) => console.error('Failed to migrate local classes to Supabase.', error))
  .then(() => notesStore.fetchClasses())
  .catch((error) => console.error('Failed to fetch classes from Supabase.', error))

Promise.all([briefsReady, classesReady]).finally(() => {
  createApp(App).use(pinia).use(router).mount('#app')
})
