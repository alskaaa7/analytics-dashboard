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
        <div class="filter-group">
          <label>Категория:</label>
          <input 
            type="text" 
            v-model="additionalFilters.category"
            @input="handleFiltersChange"
            placeholder="Поиск по категории"
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
          <label>Регион:</label>
          <input 
            type="text" 
            v-model="additionalFilters.region_name"
            @input="handleFiltersChange"
            placeholder="Поиск по региону"
            class="animated-input"
          >
        </div>
      </template>
    </Filters>

    <!-- Основной график -->
    <div class="main-chart-section">
      <div class="chart-container">
        <canvas ref="mainChart"></canvas>
      </div>
    </div>

    <!-- Таблица -->
    <div class="table-section">
      <h2 class="table-title">Топ артикулов - {{ currentMetric.title }}</h2>
      <DataTable 
        :data="topItems"
        :columns="tableColumns"
        :loading="loading"
        @row-click="handleRowClick"
      />
    </div>

    <div class="bg-elements">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'
import Filters from '../components/Filters.vue'
import { Chart, registerables } from 'chart.js'

const calculateChange = (current, previous) => {
  if (current === 0 && previous === 0) return 0
  if (previous === 0) return current > 0 ? 100 : 0
  
  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(change * 10) / 10
  return Math.abs(rounded) < 0.1 ? 0 : rounded
}

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const { 
  data: apiData, 
  loading, 
  fetchData 
} = useApi('orders')

const mainChart = ref(null)
let chartInstance = null

const additionalFilters = ref({
  nm_id: '',
  category: '',
  brand: '',
  region_name: ''
})

const metricDefinitions = {
  sales_count: { title: 'Количество продаж', icon: '📦', unit: 'шт.' },
  revenue: { title: 'Выручка', icon: '💰', unit: '₽' },
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

const topItems = computed(() => {
  if (ordersData.value.length === 0) return []

  const itemsByNmId = ordersData.value.reduce((acc, item) => {
    if (!item.nm_id) return acc
    
    const nmId = item.nm_id.toString()
    
    if (!acc[nmId]) {
      acc[nmId] = {
        nm_id: nmId,
        currentValue: 0,
        previousValue: 0, // Добавляем для предыдущего периода
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

  // Добавляем расчет изменений
  Object.values(itemsByNmId).forEach(item => {
    item.change = calculateChange(item.currentValue, item.previousValue)
  })

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
    title: 'Текущий период', 
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
    page: 1,
    limit: filters.limit || 100,
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

const initChart = () => {
  if (!mainChart.value) return

  if (chartInstance) {
    chartInstance.destroy()
  }

  // Генерируем данные для графика на основе реальных данных
  const dailyData = ordersData.value.reduce((acc, item) => {
    const date = item.date ? item.date.split('T')[0] : 'Неизвестная дата'
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
      case 'revenue': return dayData.revenue
      case 'cancellations': return dayData.cancellations
      case 'discounts': return dayData.discounts.length > 0 ? 
        dayData.discounts.reduce((a, b) => a + b, 0) / dayData.discounts.length : 0
      default: return 0
    }
  })

  chartInstance = new Chart(mainChart.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: currentMetric.value.title,
        data: data,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 3,
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        }
      }
    }
  })
}

const getDefaultDateFrom = () => {
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  return monthAgo.toISOString().split('T')[0]
}

const getDefaultDateTo = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

onMounted(() => {
  // Загружаем фильтры из query параметров
  Object.keys(additionalFilters.value).forEach(key => {
    if (route.query[key]) {
      additionalFilters.value[key] = route.query[key]
    }
  })

  const defaultFilters = {
    limit: 100,
    page: 1,
    dateFrom: getDefaultDateFrom(),
    dateTo: getDefaultDateTo(),
    ...additionalFilters.value
  }
  
  fetchData(defaultFilters)
})

watch([ordersData, mainChart], () => {
  initChart()
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

.main-chart-section {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  padding: 2rem;
  border-radius: 20px;
  margin: 2rem 0;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
}

.chart-container {
  height: 400px;
  position: relative;
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
</style>