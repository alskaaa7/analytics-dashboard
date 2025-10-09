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
    name: 'Metric',
    component: MetricPage,
    props: true
  },
  {
    path: '/article/:articleId',
    name: 'Article',
    component: ArticlePage,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
