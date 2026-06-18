import { createRouter, createWebHistory } from 'vue-router'

import CaseBriefsView from '@/views/CaseBriefsView.vue'
import CourseOutlinesView from '@/views/CourseOutlinesView.vue'

export const routes = [
  {
    path: '/',
    name: 'course-outlines',
    component: CourseOutlinesView,
  },
  {
    path: '/case-briefs',
    name: 'case-briefs',
    component: CaseBriefsView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
