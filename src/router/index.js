import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import MetricPage from '../views/MetricPage.vue'
import ArticlePage from '../views/ArticlePage.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/metric/:metricId',
    name: 'MetricPage',
    component: MetricPage
  },
  {
    path: '/article/:articleId',
    name: 'ArticlePage', 
    component: ArticlePage
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
