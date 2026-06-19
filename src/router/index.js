import { createRouter, createWebHistory } from 'vue-router'

import CaseBriefsView from '@/views/CaseBriefsView.vue'
import ClassView from '@/views/ClassView.vue'
import CourseOutlinesView from '@/views/CourseOutlinesView.vue'
import DocumentReaderView from '@/views/DocumentReaderView.vue'
import LoginView from '@/views/LoginView.vue'
import OutlineBuilderView from '@/views/OutlineBuilderView.vue'
import SignUpView from '@/views/SignUpView.vue'

export const routes = [
  {
    path: '/',
    name: 'course-outlines',
    component: CourseOutlinesView,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignUpView,
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
  {
    path: '/class/:classId/reader',
    name: 'reader',
    component: DocumentReaderView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
