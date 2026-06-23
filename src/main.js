import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@vuepic/vue-datepicker/dist/main.css'

import './assets/colors.css'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const authStore = useAuthStore(pinia)

authStore.initAuthListener().finally(() => {
  createApp(App).use(pinia).use(router).mount('#app')
})
