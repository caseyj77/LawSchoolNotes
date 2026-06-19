import { createRouter, createWebHistory } from 'vue-router'

import CaseBriefsView from '@/views/CaseBriefsView.vue'
import ClassView from '@/views/ClassView.vue'
import CourseOutlinesView from '@/views/CourseOutlinesView.vue'
import OutlineBuilderView from '@/views/OutlineBuilderView.vue'

export const routes = [
  {
    path: '/',
    name: 'course-outlines',
    component: CourseOutlinesView,
  },
  {
    path: '/class/:classId',
    name: 'class',
    component: ClassView,
  },
  {
    path: '/class/:classId/outline',
    name: 'outline-builder',
    component: OutlineBuilderView,
  },
  {
    path: '/class/:classId/case-briefs/new',
    name: 'case-brief-new',
    component: CaseBriefsView,
  },
  {
    path: '/class/:classId/case-briefs/:briefId',
    name: 'case-brief-edit',
    component: CaseBriefsView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
