import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { migrateLocalBriefsToSupabase } from './lib/migrateLocalBriefs'
import { useNotesStore } from './stores/notesStore'
import App from './App.vue'
import router from './router'

const pinia = createPinia()

useNotesStore(pinia)
  .getTemplateSections()
  .then((sections) => migrateLocalBriefsToSupabase(sections))
  .catch((error) => console.error('Failed to migrate local case briefs to Supabase.', error))

createApp(App).use(pinia).use(router).mount('#app')
