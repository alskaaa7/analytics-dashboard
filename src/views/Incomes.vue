<template>
  <div class="page dark-theme">
    <h1 class="page-title">🚀 Доходы</h1>
    
    <Filters @filters-change="handleFiltersChange">
      <template #additional-filters>
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
          <label>Город:</label>
          <input 
            type="text" 
            v-model="additionalFilters.warehouse_name"
            @input="handleFiltersChange"
            placeholder="Поиск по городу"
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

    <transition-group name="stagger-fade" tag="div" class="debug-info" v-if="error || (incomesData.length === 0 && !loading)">
      <div v-if="error" key="error" class="error-message slide-in">
        <span class="icon">⚠️</span>
        {{ error }}
      </div>
      <div v-if="!loading && incomesData.length === 0" key="no-data" class="no-data-message slide-in">
        <span class="icon">🔍</span>
        Данные не найдены. Проверьте параметры фильтрации.
      </div>
    </transition-group>

    <transition-group name="stats-slide" tag="div" class="stats" v-if="incomesData.length > 0">
      <div class="stat-card" v-for="(stat, index) in computedStats" :key="stat.label" :data-index="index">
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-progress"></div>
        <div class="stat-glow"></div>
      </div>
    </transition-group>

    <transition name="chart-scale" mode="out-in">
      <div class="charts-section" v-if="incomesData.length > 0 && chartData.labels.length > 0" key="chart">
        <div class="charts-header">
          <h2>
            <span class="icon">📊</span>
            Распределение по складам
          </h2>
          <div class="chart-actions">
            <button @click="toggleChartType" class="chart-btn">
              <span class="btn-icon">{{ chartType === 'bar' ? '📈' : '📊' }}</span>
              {{ chartType === 'bar' ? 'Линейный' : 'Столбчатый' }}
            </button>
          </div>
        </div>
        
        <div class="chart-container">
          <canvas ref="chartCanvas" class="chart-canvas"></canvas>
          <div class="chart-loading" v-if="chartLoading">
            <div class="loading-spinner"></div>
          </div>
        </div>
        
        <div class="chart-stats">
          <div class="chart-stat-item" v-for="stat in chartStats" :key="stat.label">
            <span class="stat-label">{{ stat.label }}</span>
            <span class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </div>
    </transition>

    <transition name="table-fade" mode="out-in">
      <DataTable 
        :data="incomesData"
        :columns="tableColumns"
        :loading="loading"
        :error="error"
        key="datatable"
      />
    </transition>

    <transition name="pagination-slide">
      <Pagination
        v-if="pagination && incomesData.length > 0"
        :current-page="currentPage"
        :total-pages="pagination.last_page || 1"
        :total-items="pagination.total || 0"
        @page-change="handlePageChange"
        key="pagination"
      />
    </transition>

    <transition name="zoom">
      <button 
        v-if="incomesData.length > 10" 
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
} = useApi('incomes')

const currentPage = ref(1)
const additionalFilters = ref({
  nm_id: '',
  warehouse_name: '',
  key: ''
})
const chartCanvas = ref(null)
const chartType = ref('bar')
const chartLoading = ref(false)
const showFab = ref(false)
let chartInstance = null
let scrollHandler = null

const getDefaultDateFrom = () => {
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  return monthAgo.toISOString().split('T')[0]
}

const getDefaultDateTo = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const incomesData = computed(() => {
  if (!apiData.value) return []
  
  if (Array.isArray(apiData.value)) {
    return apiData.value
  }
  
  if (apiData.value && apiData.value.data) {
    return apiData.value.data
  }
  
  if (apiData.value && apiData.value.incomes) {
    return apiData.value.incomes
  }
  
  if (apiData.value && apiData.value.results) {
    return apiData.value.results
  }
  
  return Object.values(apiData.value)
})

const computedStats = computed(() => [
  {
    value: incomesData.value.length,
    label: 'Всего поступлений',
    icon: '📦'
  },
  {
    value: totalQuantity.value.toLocaleString(),
    label: 'Общее количество',
    icon: '📈'
  },
  {
    value: totalValue.value.toLocaleString() + ' ₽',
    label: 'Общая стоимость',
    icon: '💰'
  },
  {
    value: avgPrice.value.toLocaleString() + ' ₽',
    label: 'Средняя цена',
    icon: '📊'
  }
])

const chartStats = computed(() => [
  {
    label: 'Всего товаров:',
    value: totalQuantity.value.toLocaleString() + ' шт.'
  },
  {
    label: 'Складов всего:',
    value: chartData.value.labels.length
  }
])

const findQuantityValue = (item) => {
  if (!item) return 0
  
  const possibleQuantityFields = ['quantity', 'Quantity', 'count', 'Count', 'qty', 'stock']
  for (const field of possibleQuantityFields) {
    if (item[field] !== undefined && item[field] !== null) {
      const quantity = parseInt(item[field])
      if (!isNaN(quantity) && quantity > 0) {
        return quantity
      }
    }
  }
  
  return 1
}

const findPriceValue = (item) => {
  if (!item) return 0
  
  if (item.total_price !== undefined && item.total_price !== null) {
    const price = parseFloat(item.total_price)
    if (!isNaN(price)) {
      return price
    }
  }
  
  return 0
}

const findWarehouseValue = (item) => {
  if (!item) return 'Не указан'
  return item.warehouse_name || item.warehouse || item.storage || 'Не указан'
}

const totalQuantity = computed(() => {
  return incomesData.value.reduce((sum, item) => sum + findQuantityValue(item), 0)
})

const totalValue = computed(() => {
  return incomesData.value.reduce((sum, item) => sum + findPriceValue(item), 0)
})

const avgPrice = computed(() => {
  const totalQuantityValue = totalQuantity.value
  return totalQuantityValue === 0 ? 0 : Math.round(totalValue.value / totalQuantityValue)
})

const chartData = computed(() => {
  if (incomesData.value.length === 0) {
    return { labels: [], datasets: [] }
  }

  const warehouseData = {}
  
  incomesData.value.forEach(item => {
    const warehouse = findWarehouseValue(item)
    const quantity = findQuantityValue(item)
    
    if (quantity > 0) {
      warehouseData[warehouse] = (warehouseData[warehouse] || 0) + quantity
    }
  })

  const sortedData = Object.entries(warehouseData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)

  return {
    labels: sortedData.map(([label]) => label),
    datasets: [{
      label: 'Количество товаров',
      data: sortedData.map(([,value]) => value),
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

const initChart = async () => {
  if (!chartCanvas.value || chartData.value.labels.length === 0) {
    return
  }

  chartLoading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: chartType.value,
    data: chartData.value,
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
          text: 'Распределение товаров по складам',
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

const toggleChartType = () => {
  chartType.value = chartType.value === 'bar' ? 'line' : 'bar'
  initChart()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const getRussianColumnName = (key) => {
  const translations = {
    'income_id': 'ID',
    'number': 'Номер',
    'date': 'Дата',
    'last_change_date': 'Дата изменения', 
    'supplier_article': 'Артикул поставщика',
    'tech_size': 'Размер',
    'barcode': 'Штрихкод',
    'quantity': 'Количество',
    'total_price': 'Общая стоимость',
    'date_close': 'Дата закрытия',
    'warehouse_name': 'Склад',
    'nm_id': 'Артикул'
  }
  
  return translations[key] || key.replace(/_/g, ' ').replace(/^./, str => str.toUpperCase())
}

const tableColumns = computed(() => {
  if (incomesData.value.length === 0) return []
  
  const firstItem = incomesData.value[0]
  const columns = []
  console.log('Все ключи данных:', Object.keys(firstItem))
  
  Object.keys(firstItem).forEach(key => {
    let type = 'string'
    
    if (typeof firstItem[key] === 'number') {
      type = 'number'
    } else if (typeof firstItem[key] === 'boolean') {
      type = 'boolean'
    } else if (key.includes('date') || key.includes('Date')) {
      type = 'datetime'
    } else if (key === 'total_price' || key.includes('price') || key.includes('cost')) {
      type = 'currency'
    } else if (key.includes('quantity')) {
      type = 'number'
    }
    
    columns.push({
      key: key,
      title: getRussianColumnName(key),
      type: type,
    })
  })
  
  return columns
})

const handleFiltersChange = (filters) => {
  currentPage.value = filters.page || 1
  
  const apiFilters = {
    page: currentPage.value,
    limit: filters.limit || 100,
    dateFrom: filters.dateFrom || getDefaultDateFrom(),
    dateTo: filters.dateTo || getDefaultDateTo()
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
  
  fetchData(apiFilters)
}

const handlePageChange = (page) => {
  currentPage.value = page
  handleFiltersChange({ page })
}

onMounted(() => {
  const defaultFilters = {
    limit: 100,
    page: 1,
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo()
  }
  
  fetchData(defaultFilters)

  scrollHandler = () => {
    showFab.value = window.scrollY > 500
  }
  window.addEventListener('scroll', scrollHandler)
})

watch([incomesData, chartCanvas, chartType], () => {
  if (incomesData.value.length > 0 && chartCanvas.value) {
    nextTick(() => {
      setTimeout(() => {
        initChart()
      }, 100)
    })
  }
}, { immediate: true, deep: true })

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy()
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #c026d3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: titleGlow 3s ease-in-out infinite alternate;
  font-family: 'Inter', sans-serif;
}

@keyframes titleGlow {
  from {
    text-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  }
  to {
    text-shadow: 0 0 30px rgba(139, 92, 246, 0.8), 0 0 40px rgba(192, 38, 211, 0.6);
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
    inset 0 1px 0 rgb(3, 21, 66);
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(10px);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 20px 40px rgba(99, 102, 241, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(99, 101, 241, 0.773);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left 0.6s ease;
}

.stat-card:hover::before {
  left: 100%;
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.5));
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
  text-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
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
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #c026d3);
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
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #c026d3);
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

.charts-section {
  margin: 3rem 0;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.2);
  backdrop-filter: blur(10px);
}

.charts-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #c026d3);
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
  filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.5));
}

.chart-actions {
  display: flex;
  gap: 0.5rem;
}

.chart-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(99, 102, 241, 0.3);
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
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

.chart-container {
  background: rgba(15, 23, 42, 0.6);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
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
  border: 3px solid rgba(99, 102, 241, 0.3);
  border-top: 3px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  margin-top: 1.5rem;
  backdrop-filter: blur(10px);
}

.chart-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  border-left: 4px solid #6366f1;
  transition: all 0.3s ease;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.chart-stat-item:hover {
  transform: translateX(8px);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
}

.chart-stat-item .stat-label {
  font-weight: 500;
  color: #cbd5e1;
  margin: 0;
}

.chart-stat-item .stat-value {
  font-weight: 600;
  color: #f1f5f9;
  font-size: 1rem;
  font-family: 'JetBrains Mono', monospace;
}

.debug-info {
  margin: 1rem 0;
  color: #1a1b2e;
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
  color: hsl(213, 45%, 19%);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.filter-group label) {
  font-weight: 600;
  color: #d3d3da !important;
  font-size: 0.95rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:deep(.filter-container label) {
  background-color: #18085b24 !important;
}

.animated-input {
  padding: 0.75rem 1rem;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: rgba(15, 23, 42, 0.8);
  color: #1e3149;
  font-family: 'Inter', sans-serif;
  backdrop-filter: blur(10px);
}

.animated-input::placeholder {
  color: #64748b;
}

.animated-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  transform: scale(1.02);
  background: rgba(15, 23, 42, 0.9);
}

.animated-input:hover {
  border-color: rgba(99, 102, 241, 0.5);
}

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 
    0 8px 25px rgba(99, 102, 241, 0.4),
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
    0 12px 35px rgba(99, 102, 241, 0.6),
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
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #c026d3);
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
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
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
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #8b5cf6, #c026d3);
}

:deep(.data-table) td,
:deep(.data-table) th,
:deep(.data-table) span,
:deep(.data-table) div {
  color: #abb1b8e5 !important;
}

:deep(.data-table) * {
  color: #f1f5f9 !important;
  background-color:#1a1b2e !important;
}

:deep(.filters) {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%) !important;
}
</style>