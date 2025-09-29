import { createRouter, createWebHistory } from 'vue-router'
import Sales from '../views/Sales.vue'
import Orders from '../views/Orders.vue'
import Stocks from '../views/Stocks.vue'
import Incomes from '../views/Incomes.vue'

const routes = [
  { path: '/', redirect: '/sales' },
  { path: '/sales', component: Sales },
  { path: '/orders', component: Orders },
  { path: '/stocks', component: Stocks },
  { path: '/incomes', component: Incomes }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router