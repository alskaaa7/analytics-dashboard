<template>
  <div class="page dark-theme">
    <h1 class="page-title">🏭 Склады</h1>
    
    <Filters :show-date-to="true" @filters-change="handleFiltersChange">
      <template #additional-filters>
        <div class="filter-group">
          <label>Дата (dateFrom):</label>
          <input 
            type="date" 
            v-model="additionalFilters.dateFrom"
            @change="handleFiltersChange"
            class="animated-input"
          >
        </div>
        
        <div class="filter-group">
          <label>Артикул:</label>
          <input 
            type="text" 
            v-model="additionalFilters.nm_id"
            @input="handleFiltersChange"
            placeholder="Поиск по артикулу"
            class="animated-input"
          >
        </div>
        <div class="filter-group">
          <label>Склад:</label>
          <input 
            type="text" 
            v-model="additionalFilters.warehouse_name"
            @input="handleFiltersChange"
            placeholder="Поиск по складу"
            class="animated-input"
          >
        </div>
        <div class="filter-group">
          <label>Бренд:</label>
          <input 
            type="text" 
            v-model="additionalFilters.brand"
            @input="handleFiltersChange"
            placeholder="Поиск по бренду"
            class="animated-input"
          >
        </div>
        <div class="filter-group">
          <label>Ключ:</label>
          <input 
            type="text" 
            v-model="additionalFilters.key"
            @input="handleFiltersChange"
            placeholder="API ключ"
            class="animated-input"
          >
        </div>
      </template>
    </Filters>

    <transition-group name="stagger-fade" tag="div" class="debug-info" v-if="error || (stocksData.length === 0 && !loading)">
      <div v-if="error" key="error" class="error-message slide-in">
        <span class="icon">⚠️</span>
        {{ error }}
      </div>
      <div v-if="!loading && stocksData.length === 0" key="no-data" class="no-data-message slide-in">
        <span class="icon">🔍</span>
        Данные не найдены. Проверьте параметры фильтрации.
      </div>
    </transition-group>

    <transition-group name="stats-slide" tag="div" class="stats" v-if="stocksData.length > 0">
      <div class="stat-card" v-for="(stat, index) in computedStats" :key="stat.label" :data-index="index">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-progress"></div>
        <div class="stat-glow"></div>
      </div>
    </transition-group>

    <div class="charts-container" v-if="stocksData.length > 0">
      <transition name="chart-scale" mode="out-in">
        <div class="charts-section" v-if="quantityChartData.labels.length > 0" key="quantity-chart">
          <div class="charts-header">
            <h2>
              <span class="icon">📦</span>
              Распределение количества товаров по складам
            </h2>
            <div class="chart-actions">
              <button @click="toggleQuantityChartType" class="chart-btn">
                <span class="btn-icon">{{ quantityChartType === 'bar' ? '📈' : '📊' }}</span>
                {{ quantityChartType === 'bar' ? 'Линейный' : 'Столбчатый' }}
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <canvas ref="quantityChartCanvas" class="chart-canvas"></canvas>
            <div class="chart-loading" v-if="chartLoading">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
      </transition>

      <transition name="chart-scale" mode="out-in">
        <div class="charts-section" v-if="valueChartData.labels.length > 0" key="value-chart">
          <div class="charts-header">
            <h2>
              <span class="icon">💰</span>
              Распределение стоимости товаров по складам
            </h2>
            <div class="chart-actions">
              <button @click="toggleValueChartType" class="chart-btn">
                <span class="btn-icon">{{ valueChartType === 'bar' ? '📈' : '📊' }}</span>
                {{ valueChartType === 'bar' ? 'Линейный' : 'Столбчатый' }}
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <canvas ref="valueChartCanvas" class="chart-canvas"></canvas>
            <div class="chart-loading" v-if="chartLoading">
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <transition name="table-fade" mode="out-in">
      <DataTable 
        :data="tableDataWithTotalValue"
        :columns="tableColumns"
        :loading="loading"
        :error="error"
        key="datatable"
      />
    </transition>

    <transition name="pagination-slide">
      <Pagination
        v-if="pagination && stocksData.length > 0"
        :current-page="currentPage"
        :total-pages="pagination.last_page || 1"
        :total-items="pagination.total || 0"
        @page-change="handlePageChange"
        key="pagination"
      />
    </transition>

    <transition name="zoom">
      <button 
        v-if="stocksData.length > 10" 
        @click="scrollToTop" 
        class="fab"
        :class="{ 'fab-visible': showFab }"
      >
        <span class="fab-icon">↑</span>
        <div class="fab-glow"></div>
      </button>
    </transition>

    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'
import Filters from '../components/Filters.vue'
import Pagination from '../components/Pagination.vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const { 
  data: apiData, 
  loading, 
  error, 
  pagination, 
  fetchData 
} = useApi('stocks')

const currentPage = ref(1)
const additionalFilters = ref({
  dateFrom: '',
  nm_id: '',
  warehouse_name: '',
  brand: '',
  key: ''
})
const quantityChartCanvas = ref(null)
const valueChartCanvas = ref(null)
const quantityChartType = ref('bar')
const valueChartType = ref('bar')
const chartLoading = ref(false)
const showFab = ref(false)
let quantityChartInstance = null
let valueChartInstance = null
let scrollHandler = null

const stocksData = computed(() => {
  if (!apiData.value) return []
  
  if (Array.isArray(apiData.value)) {
    return apiData.value
  }
  
  if (apiData.value && apiData.value.data) {
    return apiData.value.data
  }
  
  if (apiData.value && apiData.value.stocks) {
    return apiData.value.stocks
  }
  
  if (apiData.value && apiData.value.results) {
    return apiData.value.results
  }
  
  return Object.values(apiData.value)
})

const totalQuantity = computed(() => {
  return stocksData.value.reduce((sum, item) => sum + (Number(item.quantity_full) || 0), 0)
})

const totalValue = computed(() => {
  return stocksData.value.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity_full) || 0), 0)
})

const uniqueWarehouses = computed(() => {
  const warehouses = new Set(stocksData.value.map(item => item.warehouse_name).filter(Boolean))
  return warehouses.size
})

const uniqueProducts = computed(() => {
  const products = new Set(stocksData.value.map(item => item.nm_id).filter(Boolean))
  return products.size
})

const computedStats = computed(() => [
  {
    value: stocksData.value.length,
    label: 'Всего позиций',
    icon: '📊'
  },
  {
    value: totalQuantity.value.toLocaleString(),
    label: 'Общее количество на сайте',
    icon: '📦'
  },
  {
    value: uniqueWarehouses.value,
    label: 'Уникальных складов',
    icon: '🏢'
  },
  {
    value: totalValue.value.toLocaleString() + ' ₽',
    label: 'Общая стоимость на сайте',
    icon: '💰'
  }
])

const quantityChartData = computed(() => {
  if (stocksData.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  const warehouseStats = stocksData.value.reduce((acc, item) => {
    const warehouse = item.warehouse_name || 'Не указан'
    if (!acc[warehouse]) {
      acc[warehouse] = 0
    }
    acc[warehouse] += Number(item.quantity_full) || 0
    return acc
  }, {})

  const sortedWarehouses = Object.entries(warehouseStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)

  return {
    labels: sortedWarehouses.map(([name]) => name),
    datasets: [{
      label: 'Количество товаров на сайте',
      data: sortedWarehouses.map(([,value]) => value),
      backgroundColor: [
        '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
        '#ec4899', '#f43f5e', '#ef4444', '#f97316'
      ].map(color => color + 'DD'),
      borderColor: [
        '#4f46e5', '#7c3aed', '#9333ea', '#c026d3',
        '#db2777', '#e11d48', '#dc2626', '#ea580c'
      ],
      borderWidth: 3,
      borderRadius: 8,
      borderSkipped: false,
    }]
  }
})

const valueChartData = computed(() => {
  if (stocksData.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  const warehouseValueStats = stocksData.value.reduce((acc, item) => {
    const warehouse = item.warehouse_name || 'Не указан'
    if (!acc[warehouse]) {
      acc[warehouse] = 0
    }
    const itemValue = (Number(item.price) || 0) * (Number(item.quantity_full) || 0)
    acc[warehouse] += itemValue
    return acc
  }, {})

  const sortedWarehouses = Object.entries(warehouseValueStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)

  return {
    labels: sortedWarehouses.map(([name]) => name),
    datasets: [{
      label: 'Стоимость товаров на сайте (руб)',
      data: sortedWarehouses.map(([,value]) => value),
      backgroundColor: [
        '#10b981', '#059669', '#047857', '#065f46',
        '#ec4899', '#f43f5e', '#ef4444', '#f97316'
      ].map(color => color + 'DD'),
      borderColor: [
        '#059669', '#047857', '#065f46', '#064e3b',
        '#db2777', '#e11d48', '#dc2626', '#ea580c'
      ],
      borderWidth: 3,
      borderRadius: 8,
      borderSkipped: false,
    }]
  }
})

const initQuantityChart = async () => {
  if (!quantityChartCanvas.value || quantityChartData.value.labels.length === 0) {
    return
  }

  chartLoading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  if (quantityChartInstance) {
    quantityChartInstance.destroy()
  }

  quantityChartInstance = new Chart(quantityChartCanvas.value, {
    type: quantityChartType.value,
    data: quantityChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Распределение количества товаров по складам',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          color: '#e2e8f0'
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          cornerRadius: 8,
          borderColor: '#6366f1',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#cbd5e1',
          callbacks: {
            label: function(context) {
              return `Количество: ${context.parsed.y.toLocaleString()} шт.`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(100, 116, 139, 0.2)'
          },
          ticks: {
            color: '#94a3b8',
            callback: function(value) {
              return value.toLocaleString() + ' шт.'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#94a3b8'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })

  chartLoading.value = false
}

const initValueChart = async () => {
  if (!valueChartCanvas.value || valueChartData.value.labels.length === 0) {
    return
  }

  chartLoading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  if (valueChartInstance) {
    valueChartInstance.destroy()
  }

  valueChartInstance = new Chart(valueChartCanvas.value, {
    type: valueChartType.value,
    data: valueChartData.value,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Распределение стоимости товаров по складам',
          font: {
            size: 16,
            weight: 'bold',
            family: "'Inter', sans-serif"
          },
          color: '#e2e8f0'
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 12,
          cornerRadius: 8,
          borderColor: '#10b981',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#cbd5e1',
          callbacks: {
            label: function(context) {
              return `Стоимость: ${context.parsed.y.toLocaleString()} ₽`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(100, 116, 139, 0.2)'
          },
          ticks: {
            color: '#94a3b8',
            callback: function(value) {
              return value.toLocaleString() + ' ₽'
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#94a3b8'
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  })

  chartLoading.value = false
}

const toggleQuantityChartType = () => {
  quantityChartType.value = quantityChartType.value === 'bar' ? 'line' : 'bar'
  initQuantityChart()
}

const toggleValueChartType = () => {
  valueChartType.value = valueChartType.value === 'bar' ? 'line' : 'bar'
  initValueChart()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const tableDataWithTotalValue = computed(() => {
  return stocksData.value.map(item => ({
    ...item,
    total_value: (Number(item.price) || 0) * (Number(item.quantity_full) || 0)
  }))
})

const tableColumns = [
  { key: 'warehouse_name', title: 'Склад', type: 'string' },
  { key: 'nm_id', title: 'Артикул', type: 'number' },
  { key: 'subject', title: 'Предмет', type: 'string' },
  { key: 'brand', title: 'Бренд', type: 'string' },
  { key: 'category', title: 'Категория', type: 'string' },
  { key: 'quantity_full', title: 'Количество на сайте', type: 'number' },
  { key: 'quantity', title: 'Доступно для продажи', type: 'number' },
  { key: 'price', title: 'Цена за единицу', type: 'currency' },
  { key: 'total_value', title: 'Общая стоимость', type: 'currency' },
  { key: 'tech_size', title: 'Размер', type: 'string' },
  { key: 'supplier_article', title: 'Артикул поставщика', type: 'string' },
  { key: 'barcode', title: 'Штрихкод', type: 'number' },
  { key: 'discount', title: 'Скидка', type: 'currency' },
  { key: 'date', title: 'Дата', type: 'datetime' },
  { key: 'last_change_date', title: 'Дата изменения', type: 'datetime' }
]

const handleFiltersChange = (filters) => {
  currentPage.value = filters.page || 1
  
  const apiFilters = {
    page: currentPage.value,
    limit: filters.limit || 100
  }
  
  if (additionalFilters.value.dateFrom) {
    apiFilters.dateFrom = additionalFilters.value.dateFrom
  }
  
  if (additionalFilters.value.key) {
    apiFilters.key = additionalFilters.value.key
  }
  if (additionalFilters.value.nm_id) {
    apiFilters.nm_id = additionalFilters.value.nm_id
  }
  if (additionalFilters.value.warehouse_name) {
    apiFilters.warehouse_name = additionalFilters.value.warehouse_name
  }
  if (additionalFilters.value.brand) {
    apiFilters.brand = additionalFilters.value.brand
  }
  
  fetchData(apiFilters)
}

const handlePageChange = (page) => {
  currentPage.value = page
  handleFiltersChange({ page })
}

onMounted(() => {
  const today = new Date().toISOString().split('T')[0]
  additionalFilters.value.dateFrom = today
  
  const defaultFilters = {
    limit: 100,
    page: 1,
    dateFrom: today
  }
  
  fetchData(defaultFilters)

  scrollHandler = () => {
    showFab.value = window.scrollY > 500
  }
  window.addEventListener('scroll', scrollHandler)
})

watch([stocksData, quantityChartCanvas, quantityChartType], () => {
  if (stocksData.value.length > 0 && quantityChartCanvas.value) {
    nextTick(() => {
      setTimeout(() => {
        initQuantityChart()
      }, 100)
    })
  }
}, { immediate: true, deep: true })

watch([stocksData, valueChartCanvas, valueChartType], () => {
  if (stocksData.value.length > 0 && valueChartCanvas.value) {
    nextTick(() => {
      setTimeout(() => {
        initValueChart()
      }, 100)
    })
  }
}, { immediate: true, deep: true })

onUnmounted(() => {
  if (quantityChartInstance) {
    quantityChartInstance.destroy()
  }
  if (valueChartInstance) {
    valueChartInstance.destroy()
  }
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler)
  }
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap');

.page {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
  font-family: 'Inter', sans-serif;
}

.dark-theme {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1b2e 50%, #0f0f23 100%);
  color: #e2e8f0;
}

.page-title {
  margin-bottom: 2rem;
  color: #f1f5f9;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGlow 3s ease-in-out infinite alternate;
  font-family: 'Inter', sans-serif;
}

@keyframes titleGlow {
  from {
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(217, 119, 6, 0.8), 0 0 40px rgba(180, 83, 9, 0.6);
  }
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem 1.5rem;
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(245, 158, 11, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(245, 158, 11, 0.5);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent);
  transition: left 0.6s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.5));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 10px rgba(245, 158, 11, 0.3);
}

.stat-label {
  color: #94a3b8;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
  width: 100%;
  transform: scaleX(0);
  transform-origin: left;
  animation: progressFill 1.5s ease-out 0.5s forwards;
}

.stat-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #f59e0b, #d97706, #b45309);
  border-radius: 18px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.stat-card:hover .stat-glow {
  opacity: 0.3;
}

@keyframes progressFill {
  to {
    transform: scaleX(1);
  }
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 3rem 0;
}

@media (max-width: 1200px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}

.charts-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(245, 158, 11, 0.2);
  backdrop-filter: blur(10px);
}

.charts-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #f59e0b, #d97706, #b45309);
}

.charts-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.charts-header h2 {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.chart-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  background: rgba(15, 23, 42, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(10px);
}

.chart-btn:hover {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

.chart-container {
  background: rgba(15, 23, 42, 0.6);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  height: 400px;
  position: relative;
  overflow: hidden;
}

.chart-canvas {
  transition: opacity 0.3s ease;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(245, 158, 11, 0.3);
  border-top: 3px solid #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.debug-info {
  margin: 1rem 0;
}

.error-message, .no-data-message {
  padding: 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
}

.error-message {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.2) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fecaca;
}

.no-data-message {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.2) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #bae6fd;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.filter-group label) {
  font-weight: 600;
  color: #e2e8f0 !important;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.animated-input {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  font-family: 'Inter', sans-serif;
  backdrop-filter: blur(10px);
}

.animated-input::placeholder {
  color: #64748b;
}

.animated-input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
  transform: scale(1.02);
  background: rgba(15, 23, 42, 0.9);
}

.animated-input:hover {
  border-color: rgba(245, 158, 11, 0.5);
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 
    0 8px 25px rgba(245, 158, 11, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0;
  transform: scale(0) rotate(-180deg);
  z-index: 1000;
  font-family: 'Inter', sans-serif;
}

.fab-visible {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.fab:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 
    0 12px 35px rgba(245, 158, 11, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.2);
}

.fab:active {
  transform: scale(0.95) rotate(0deg);
}

.fab-icon {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fab-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(135deg, #f59e0b, #d97706, #b45309);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  animation: fabPulse 2s ease-in-out infinite;
}

@keyframes fabPulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

.bg-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
  animation: floatBackground 20s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: -5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 20%;
  animation-delay: -10s;
}

@keyframes floatBackground {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(15px) rotate(240deg);
  }
}

.stagger-fade-move,
.stagger-fade-enter-active,
.stagger-fade-leave-active {
  transition: all 0.5s ease;
}

.stagger-fade-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.stagger-fade-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.stagger-fade-leave-active {
  position: absolute;
}

.stats-slide-enter-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.stats-slide-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.stats-slide-move {
  transition: transform 0.6s ease;
}

.chart-scale-enter-active,
.chart-scale-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-scale-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.chart-scale-leave-to {
  opacity: 0;
  transform: scale(1.1) translateY(-20px);
}

.table-fade-enter-active,
.table-fade-leave-active {
  transition: all 0.4s ease;
}

.table-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.table-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.pagination-slide-enter-active,
.pagination-slide-leave-active {
  transition: all 0.4s ease;
}

.pagination-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.pagination-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0) rotate(-180deg);
}

.slide-in {
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .stats {
    grid-template-columns: 1fr;
  }
  
  .charts-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .fab {
    bottom: 1rem;
    right: 1rem;
    width: 50px;
    height: 50px;
  }
  
  .page-title {
    font-size: 2rem;
  }
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.8);
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
}

:deep(.data-table) {
  background: transparent !important;
}

:deep(.data-table) td,
:deep(.data-table) th,
:deep(.data-table) span,
:deep(.data-table) div {
  color: #abb1b8e5 !important;
  background-color: #1a1b2e !important;
}

:deep(.filters) {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
}

</style>