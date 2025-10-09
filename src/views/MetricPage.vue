<template>
  <div class="page dark-theme">
    <div class="page-header">
      <button @click="goBack" class="back-btn">
        <span class="back-icon">←</span>
        Назад
      </button>
      <h1 class="page-title">{{ currentMetric.title }}</h1>
    </div>

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
      </template>
    </Filters>

    <!-- Loading State -->
    <div v-if="loading" class="loading-section">
      <div class="loading-spinner-large"></div>
      <div class="loading-text">Загрузка данных...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-section">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
      <button @click="retryLoading" class="retry-btn">
        Повторить попытку
      </button>
    </div>

    <!-- Main Chart -->
    <div v-else-if="ordersData.length > 0" class="main-chart-section">
      <div class="chart-header">
        <h3>Динамика {{ currentMetric.title.toLowerCase() }}</h3>
        <div class="chart-stats">
          <span class="stat-item">Всего записей: {{ ordersData.length }}</span>
          <span class="stat-item">Период: {{ dateRange }}</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas ref="mainChart" id="mainChartCanvas"></canvas>
      </div>
    </div>

    <!-- No Data -->
    <div v-else class="no-data-section">
      <div class="no-data-icon">📊</div>
      <div class="no-data-text">Нет данных для отображения</div>
      <div class="no-data-subtext">Попробуйте изменить параметры фильтрации</div>
    </div>

    <!-- Table -->
    <div class="table-section" v-if="ordersData.length > 0 && !loading">
      <h2 class="table-title">Топ артикулов - {{ currentMetric.title }}</h2>
      <DataTable 
        :data="topItems"
        :columns="tableColumns"
        :loading="loading"
        @row-click="handleRowClick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'
import Filters from '../components/Filters.vue'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const route = useRoute()
const router = useRouter()

const { 
  data: apiData, 
  loading, 
  error: apiError,
  fetchData 
} = useApi('orders')

const mainChart = ref(null)
let chartInstance = null

const additionalFilters = ref({
  nm_id: ''
})

const metricDefinitions = {
  sales_count: { title: 'Количество продаж', icon: '📦', unit: 'шт.' },
  revenue: { title: 'Доход', icon: '💰', unit: '₽' },
  cancellations: { title: 'Количество отмен', icon: '❌', unit: 'шт.' },
  discounts: { title: 'Средняя скидка', icon: '🎯', unit: '%' }
}

const currentMetric = computed(() => {
  const metricId = route.params.metricId
  return metricDefinitions[metricId] || { title: 'Метрика', icon: '📊', unit: '' }
})

const ordersData = computed(() => {
  if (!apiData.value) return []
  return Array.isArray(apiData.value) ? apiData.value : 
         apiData.value.data || apiData.value.orders || apiData.value.results || []
})

const error = computed(() => {
  return apiError.value
})

const dateRange = computed(() => {
  if (ordersData.value.length === 0) return 'Нет данных'
  
  const dates = ordersData.value
    .map(item => item.date ? new Date(item.date) : null)
    .filter(date => date && !isNaN(date.getTime()))
  
  if (dates.length === 0) return 'Нет данных'
  
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))
  
  return `${minDate.toLocaleDateString('ru-RU')} - ${maxDate.toLocaleDateString('ru-RU')}`
})

const topItems = computed(() => {
  if (ordersData.value.length === 0) return []

  const itemsByNmId = ordersData.value.reduce((acc, item) => {
    if (!item.nm_id) return acc
    
    const nmId = item.nm_id.toString()
    
    if (!acc[nmId]) {
      acc[nmId] = {
        nm_id: nmId,
        currentValue: 0,
        name: item.subject || `Артикул ${nmId}`
      }
    }

    const metricId = route.params.metricId
    switch (metricId) {
      case 'sales_count':
        acc[nmId].currentValue += 1
        break
      case 'revenue':
        acc[nmId].currentValue += Number(item.total_price) || 0
        break
      case 'cancellations':
        if (item.is_cancel) {
          acc[nmId].currentValue += 1
        }
        break
      case 'discounts':
        if (item.discount_percent) {
          acc[nmId].currentValue = (acc[nmId].currentValue || 0) + (Number(item.discount_percent) || 0)
        }
        break
    }

    return acc
  }, {})

  // Для скидок вычисляем среднее значение
  if (route.params.metricId === 'discounts') {
    Object.keys(itemsByNmId).forEach(nmId => {
      const item = itemsByNmId[nmId]
      const itemCount = ordersData.value.filter(order => 
        order.nm_id && order.nm_id.toString() === nmId && order.discount_percent
      ).length
      
      if (itemCount > 0) {
        item.currentValue = item.currentValue / itemCount
      }
    })
  }

  return Object.values(itemsByNmId)
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 10)
})

const tableColumns = computed(() => [
  { 
    key: 'nm_id', 
    title: 'Артикул', 
    type: 'number',
    render: (value, row) => `
      <div class="article-cell" data-nm-id="${value}">
        <strong>${value}</strong>
        <div class="article-name">${row.name}</div>
      </div>
    `
  },
  { 
    key: 'currentValue', 
    title: 'Значение', 
    type: 'number',
    render: (value) => formatValue(value)
  }
])

const formatValue = (value) => {
  const metricId = route.params.metricId
  switch (metricId) {
    case 'revenue':
      return Math.round(value).toLocaleString() + ' ₽'
    case 'discounts':
      return value.toFixed(1) + '%'
    default:
      return Math.round(value).toLocaleString()
  }
}

const handleFiltersChange = (filters) => {
  const apiFilters = {
    limit: 500, // Уменьшаем лимит для теста
    dateFrom: filters.dateFrom || getDefaultDateFrom(),
    dateTo: filters.dateTo || getDefaultDateTo(),
    ...additionalFilters.value
  }
  
  // Убираем пустые фильтры
  Object.keys(apiFilters).forEach(key => {
    if (apiFilters[key] === '') {
      delete apiFilters[key]
    }
  })
  
  fetchData(apiFilters)
}

const handleRowClick = (row) => {
  router.push({
    path: `/article/${row.nm_id}`,
    query: additionalFilters.value
  })
}

const goBack = () => {
  router.back()
}

const retryLoading = () => {
  const defaultFilters = {
    limit: 500,
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo(),
    ...additionalFilters.value
  }
  
  fetchData(defaultFilters)
}

const initChart = () => {
  if (!mainChart.value) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  if (ordersData.value.length === 0) return

  try {
    // Генерируем данные для графика
    const dailyData = ordersData.value.reduce((acc, item) => {
      const date = item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { sales: 0, revenue: 0, cancellations: 0, discounts: [] }
      }
      
      acc[date].sales += 1
      acc[date].revenue += Number(item.total_price) || 0
      if (item.is_cancel) acc[date].cancellations += 1
      if (item.discount_percent) acc[date].discounts.push(Number(item.discount_percent))
      
      return acc
    }, {})

    const sortedDates = Object.keys(dailyData).sort()
    const labels = sortedDates.map(date => {
      const d = new Date(date)
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
    })

    const data = sortedDates.map(date => {
      const dayData = dailyData[date]
      const metricId = route.params.metricId
      
      switch (metricId) {
        case 'sales_count': return dayData.sales
        case 'revenue': return Math.round(dayData.revenue)
        case 'cancellations': return dayData.cancellations
        case 'discounts': 
          return dayData.discounts.length > 0 ? 
            Number((dayData.discounts.reduce((a, b) => a + b, 0) / dayData.discounts.length).toFixed(1)) : 0
        default: return 0
      }
    })

    const ctx = mainChart.value.getContext('2d')
    
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: currentMetric.value.title,
          data: data,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ec4899',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#f1f5f9',
              font: {
                size: 14
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f1f5f9',
            bodyColor: '#e2e8f0',
            borderColor: '#ec4899',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#94a3b8'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#94a3b8'
            }
          }
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Chart initialization error:', error)
  }
}

const getDefaultDateFrom = () => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return weekAgo.toISOString().split('T')[0]
}

const getDefaultDateTo = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Load data on mount
onMounted(() => {
  // Загружаем фильтры из query параметров
  Object.keys(additionalFilters.value).forEach(key => {
    if (route.query[key]) {
      additionalFilters.value[key] = route.query[key]
    }
  })

  const defaultFilters = {
    limit: 500,
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo(),
    ...additionalFilters.value
  }
  
  fetchData(defaultFilters)
})

// Watch for data changes and initialize chart
watch(ordersData, (newData) => {
  if (newData.length > 0) {
    nextTick(() => {
      initChart()
    })
  }
})

// Watch for route changes
watch(() => route.params.metricId, () => {
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
  
  const defaultFilters = {
    limit: 500,
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo(),
    ...additionalFilters.value
  }
  
  fetchData(defaultFilters)
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
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

.back-btn:hover {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateX(-5px);
}

.back-icon {
  font-size: 1.2rem;
}

.debug-section {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 2rem;
  font-family: monospace;
  font-size: 0.9rem;
  color: #fecaca;
}

.debug-section h3 {
  margin: 0 0 0.5rem 0;
  color: #fecaca;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner-large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(239, 68, 68, 0.3);
  border-top: 4px solid #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.loading-text {
  color: #94a3b8;
  font-size: 1.1rem;
}

.error-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.error-text {
  color: #fecaca;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  color: #fecaca;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

.main-chart-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem;
  border-radius: 20px;
  margin: 2rem 0;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.chart-header h3 {
  color: #f1f5f9;
  margin: 0;
  font-size: 1.3rem;
}

.chart-stats {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  color: #94a3b8;
  font-size: 0.9rem;
}

.chart-container {
  height: 400px;
  position: relative;
}

.no-data-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin: 2rem 0;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.no-data-text {
  color: #f1f5f9;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.no-data-subtext {
  color: #94a3b8;
  font-size: 1rem;
}

.table-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
}

.table-title {
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .chart-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
