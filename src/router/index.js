import { createRouter, createWebHistory } from 'vue-router'

import CourseOutlinesView from '@/views/CourseOutlinesView.vue'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_ROUTE_NAMES = new Set(['login', 'signup'])

export const routes = [
  {
    path: '/',
    name: 'course-outlines',
    component: CourseOutlinesView,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/SignUpView.vue'),
  },
  {
    path: '/class/:classId',
    name: 'class',
    component: () => import('@/views/ClassView.vue'),
  },
  {
    path: '/class/:classId/outline',
    name: 'outline-builder',
    component: () => import('@/views/OutlineBuilderView.vue'),
  },
  {
    path: '/class/:classId/case-briefs/new',
    name: 'case-brief-new',
    component: () => import('@/views/CaseBriefsView.vue'),
  },
  {
    path: '/class/:classId/case-briefs/:briefId',
    name: 'case-brief-edit',
    component: () => import('@/views/CaseBriefsView.vue'),
  },
  {
    path: '/class/:classId/reader',
    name: 'reader',
    component: () => import('@/views/DocumentReaderView.vue'),
    props: true,
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('@/views/TasksView.vue'),
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/CalendarView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  if (!PUBLIC_ROUTE_NAMES.has(to.name) && !authStore.session) {
    return { name: 'login' }
  }
})

export default router
