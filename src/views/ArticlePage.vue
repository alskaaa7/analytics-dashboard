<template>
  <div class="page dark-theme">
    <div class="page-header">
      <button @click="goBack" class="back-btn elegant-back">
        <span class="back-icon">←</span>
        <span class="back-text">Вернуться к аналитике</span>
        <div class="back-hover-effect"></div>
      </button>
      <div class="title-section">
        <h1 class="page-title">Артикул {{ articleId }}</h1>
        <div class="title-subtitle">Детальная аналитика по товару</div>
      </div>
    </div>

    <Filters @filters-change="handleFiltersChange">
      <template #additional-filters>
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

    <div class="loading-section" v-if="loading">
      <div class="loading-spinner-large"></div>
      <div class="loading-text">Загрузка данных артикула...</div>
    </div>

    <div class="error-section" v-else-if="error">
      <div class="error-icon">⚠️</div>
      <div class="error-text">{{ error }}</div>
      <button @click="retryLoading" class="retry-btn elegant-button">
        <span class="btn-icon">🔄</span>
        Повторить попытку
      </button>
    </div>

    <div v-else-if="articleOrders.length === 0" class="no-data-section">
      <div class="no-data-icon">📦</div>
      <div class="no-data-text">Артикул {{ articleId }} не найден</div>
      <div class="no-data-subtext">Попробуйте изменить параметры фильтрации или период дат</div>
      
      <div class="available-articles">
        <h4>Доступные артикулы для тестирования:</h4>
        <div class="article-tags">
          <span 
            v-for="article in availableArticles" 
            :key="article.nm_id"
            class="article-tag elegant-tag"
            @click="navigateToArticle(article.nm_id)"
          >
            {{ article.nm_id }} ({{ article.brand }} {{ article.subject }})
          </span>
        </div>
      </div>
    </div>

    <div class="article-layout" v-else>
      <!-- Левая колонка - информация об артикуле -->
      <div class="article-info">
        <div class="article-card elegant-card">
          <div class="card-header">
            <div class="card-icon">📦</div>
            <h3 class="card-title">Информация о товаре</h3>
          </div>
          
          <div class="article-image">
            <div class="image-placeholder elegant-image">
              <span class="image-icon">🖼️</span>
              <div class="image-text">Изображение товара</div>
              <div class="article-code">{{ articleId }}</div>
            </div>
          </div>
          
          <div class="article-details">
            <div class="detail-section">
              <h4 class="section-title">Основная информация</h4>
              <div class="detail-grid">
                <div class="detail-item elegant-detail">
                  <span class="detail-label">Бренд:</span>
                  <span class="detail-value">{{ articleData.brand || 'Не указан' }}</span>
                </div>
                
                <div class="detail-item elegant-detail">
                  <span class="detail-label">Категория:</span>
                  <span class="detail-value">{{ articleData.category || 'Не указана' }}</span>
                </div>
                
                <div class="detail-item elegant-detail">
                  <span class="detail-label">Название:</span>
                  <span class="detail-value">{{ articleData.subject || 'Не указано' }}</span>
                </div>
                
                <div class="detail-item elegant-detail">
                  <span class="detail-label">Размер:</span>
                  <span class="detail-value">{{ articleData.tech_size || 'Не указан' }}</span>
                </div>
                
                <div class="detail-item elegant-detail">
                  <span class="detail-label">Штрихкод:</span>
                  <span class="detail-value">{{ articleData.barcode || 'Не указан' }}</span>
                </div>

                <div class="detail-item elegant-detail">
                  <span class="detail-label">Артикул поставщика:</span>
                  <span class="detail-value">{{ articleData.supplier_article || 'Не указан' }}</span>
                </div>
              </div>
            </div>

            <div class="stats-section">
              <h4 class="section-title">Ключевые метрики</h4>
              <div class="stats-overview elegant-stats">
                <div class="stat-overview">
                  <div class="stat-icon">🛒</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ totalSales }}</div>
                    <div class="stat-label">Всего продаж</div>
                  </div>
                </div>
                <div class="stat-overview">
                  <div class="stat-icon">💰</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ totalRevenue }} ₽</div>
                    <div class="stat-label">Общий доход</div>
                  </div>
                </div>
                <div class="stat-overview">
                  <div class="stat-icon">🎯</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ avgDiscount }}%</div>
                    <div class="stat-label">Средняя скидка</div>
                  </div>
                </div>
                <div class="stat-overview">
                  <div class="stat-icon">❌</div>
                  <div class="stat-content">
                    <div class="stat-value">{{ cancellationRate }}%</div>
                    <div class="stat-label">Процент отмен</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="time-period elegant-period">
              <div class="period-icon">📅</div>
              <div class="period-content">
                <div class="period-label">Период анализа</div>
                <div class="period-dates">{{ analysisPeriod }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Правая колонка - таблица с показателями -->
      <div class="metrics-table">
        <div class="table-card elegant-card">
          <div class="card-header">
            <div class="card-icon">📊</div>
            <h3 class="card-title">Динамика показателей по дням</h3>
          </div>
          
          <div class="table-info elegant-table-info">
            <div class="records-count">
              <span class="count-icon">📈</span>
              Найдено записей: <strong>{{ articleOrders.length }}</strong>
            </div>
            <button @click="exportToExcel" class="export-btn elegant-button secondary">
              <span class="btn-icon">📥</span>
              Экспорт в Excel
            </button>
          </div>
          
          <div class="table-container">
            <DataTable 
              :data="metricsTableData"
              :columns="metricsColumns"
              :loading="loading"
            />
          </div>
        </div>
      </div>
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

const calculateChange = (current, previous) => {
  if (current === 0 && previous === 0) return 0
  if (previous === 0) return current > 0 ? 100 : 0
  
  const change = ((current - previous) / previous) * 100
  const rounded = Math.round(change * 10) / 10
  return Math.abs(rounded) < 0.1 ? 0 : rounded
}

const route = useRoute()
const router = useRouter()

// Используем два вызова API для текущего и предыдущего периода
const { 
  data: currentApiData, 
  loading: currentLoading, 
  error: currentError, 
  fetchData: fetchCurrentData 
} = useApi('orders')

const { 
  data: previousApiData, 
  loading: previousLoading, 
  error: previousError, 
  fetchData: fetchPreviousData 
} = useApi('orders')

const additionalFilters = ref({
  category: '',
  brand: '',
  region_name: ''
})

const articleId = computed(() => route.params.articleId)

// Данные за оба периода
const currentPeriodData = ref([])
const previousPeriodData = ref([])

const loading = computed(() => currentLoading.value || previousLoading.value)
const error = computed(() => currentError.value || previousError.value)

// Данные текущего артикула
const articleOrders = computed(() => {
  return currentPeriodData.value.filter(item => {
    if (!item.nm_id) return false
    return item.nm_id.toString() === articleId.value.toString()
  })
})

// Находим запись с наиболее полными данными для отображения
const articleData = computed(() => {
  if (articleOrders.value.length === 0) return {}
  
  const recordWithData = articleOrders.value.find(item => 
    item.brand || item.category || item.subject || item.tech_size || item.barcode
  )
  
  return recordWithData || articleOrders.value[0]
})

// Сводная статистика
const totalSales = computed(() => {
  return articleOrders.value.length.toLocaleString()
})

const totalRevenue = computed(() => {
  return articleOrders.value
    .reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
    .toLocaleString()
})

const avgDiscount = computed(() => {
  const discounts = articleOrders.value
    .filter(item => item.discount_percent && Number(item.discount_percent) > 0)
    .map(item => Number(item.discount_percent))
  
  return discounts.length > 0 ? 
    Number((discounts.reduce((sum, discount) => sum + discount, 0) / discounts.length).toFixed(1)) : 0
})

const cancellationRate = computed(() => {
  const cancellations = articleOrders.value.filter(item => item.is_cancel).length
  const total = articleOrders.value.length
  return total > 0 ? Number(((cancellations / total) * 100).toFixed(1)) : 0
})
// Расчет изменений по сравнению с предыдущим периодом
const salesChange = computed(() => {
  const previousOrders = previousPeriodData.value.filter(item => 
    item.nm_id && item.nm_id.toString() === articleId.value.toString()
  )
  
  const currentCount = articleOrders.value.length
  const previousCount = previousOrders.length
  
  return calculateChange(currentCount, previousCount)
})

const revenueChange = computed(() => {
  const previousOrders = previousPeriodData.value.filter(item => 
    item.nm_id && item.nm_id.toString() === articleId.value.toString()
  )
  
  const currentRevenue = articleOrders.value.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
  const previousRevenue = previousOrders.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0)
  
  return calculateChange(currentRevenue, previousRevenue)
})
const analysisPeriod = computed(() => {
  if (articleOrders.value.length === 0) return 'Нет данных'
  
  const dates = articleOrders.value
    .map(order => new Date(order.date))
    .filter(date => !isNaN(date.getTime()))
  
  if (dates.length === 0) return 'Нет данных'
  
  const minDate = new Date(Math.min(...dates))
  const maxDate = new Date(Math.max(...dates))
  
  return `${minDate.toLocaleDateString('ru-RU')} - ${maxDate.toLocaleDateString('ru-RU')}`
})

// Данные для таблицы показателей
const metricsTableData = computed(() => {
  if (articleOrders.value.length === 0) return []

  // Группируем по датам
  const ordersByDate = articleOrders.value.reduce((acc, order) => {
    const date = order.date ? order.date.split('T')[0] : 'Неизвестная дата'
    if (!acc[date]) {
      acc[date] = {
        date: date,
        sales_count: 0,
        revenue: 0,
        cancellations: 0,
        discount_percent: 0,
        discount_count: 0,
        quantity: 0
      }
    }
    
    acc[date].sales_count += 1
    acc[date].revenue += Number(order.total_price) || 0
    acc[date].quantity += Number(order.quantity) || 1
    if (order.is_cancel) {
      acc[date].cancellations += 1
    }
    if (order.discount_percent) {
      acc[date].discount_percent += Number(order.discount_percent) || 0
      acc[date].discount_count += 1
    }
    
    return acc
  }, {})
  
  const datesData = Object.values(ordersByDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  
  const metricsData = [
    {
      metric: 'Количество продаж',
      values: datesData.reduce((acc, day) => {
        acc[day.date] = day.sales_count
        return acc
      }, {})
    },
    {
      metric: 'Доход',
      values: datesData.reduce((acc, day) => {
        acc[day.date] = Math.round(day.revenue)
        return acc
      }, {})
    },
    {
      metric: 'Количество отмен',
      values: datesData.reduce((acc, day) => {
        acc[day.date] = day.cancellations
        return acc
      }, {})
    },
    {
      metric: 'Средняя скидка',
      values: datesData.reduce((acc, day) => {
        acc[day.date] = day.discount_count > 0 ? (day.discount_percent / day.discount_count).toFixed(1) : 0
        return acc
      }, {})
    },
    {
      metric: 'Количество товаров',
      values: datesData.reduce((acc, day) => {
        acc[day.date] = day.quantity
        return acc
      }, {})
    }
  ]
  
  return metricsData
})

const metricsColumns = computed(() => {
  const dates = [...new Set(articleOrders.value
    .map(order => order.date ? order.date.split('T')[0] : null)
    .filter(date => date)
  )].sort()

  const columns = [
    { 
      key: 'metric', 
      title: 'Показатель', 
      type: 'string',
      render: (value) => `
        <div class="metric-name">
          <span class="metric-icon">${getMetricIcon(value)}</span>
          ${value}
        </div>
      `
    }
  ]

  dates.forEach(date => {
    columns.push({
      key: `values.${date}`,
      title: formatDateForTable(date),
      type: 'number',
      render: (value, row) => {
        const metric = row.metric
        const dateValue = row.values[date]
        
        if (dateValue === undefined || dateValue === null) return '<span class="no-data">-</span>'
        
        switch (metric) {
          case 'Доход':
            return `<div class="metric-value revenue">${Number(dateValue).toLocaleString()} ₽</div>`
          case 'Средняя скидка':
            return `<div class="metric-value discount">${dateValue}%</div>`
          default:
            return `<div class="metric-value">${Number(dateValue).toLocaleString()}</div>`
        }
      }
    })
  })

  return columns
})

const getMetricIcon = (metric) => {
  const icons = {
    'Количество продаж': '🛒',
    'Доход': '💰',
    'Количество отмен': '❌',
    'Средняя скидка': '🎯',
    'Количество товаров': '📦'
  }
  return icons[metric] || '📊'
}

const formatDateForTable = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit'
  })
}

// Загрузка данных за оба периода
const loadBothPeriodsData = async (filters = {}) => {
  const currentParams = {
    dateFrom: filters.dateFrom || getDefaultDateFrom(),
    dateTo: filters.dateTo || getDefaultDateTo(),
    limit: Math.min(filters.limit || 500, 500),
    page: filters.page || 1,
    nm_id: articleId.value,
    ...additionalFilters.value
  }

  const previousParams = {
    dateFrom: getPreviousPeriodStart(),
    dateTo: getPreviousPeriodEnd(), 
    limit: Math.min(filters.limit || 500, 500),
    page: filters.page || 1,
    nm_id: articleId.value,
    ...additionalFilters.value
  }

  await Promise.all([
    fetchCurrentData(currentParams),
    fetchPreviousData(previousParams)
  ])
}

const handleFiltersChange = (filters) => {
  const apiFilters = {
    page: 1,
    limit: Math.min(filters.limit || 500, 500),
    dateFrom: filters.dateFrom || getDefaultDateFrom(),
    dateTo: filters.dateTo || getDefaultDateTo(),
    nm_id: articleId.value,
    ...additionalFilters.value
  }
  
  Object.keys(apiFilters).forEach(key => {
    if (apiFilters[key] === '') {
      delete apiFilters[key]
    }
  })
  
  loadBothPeriodsData(apiFilters)
}

const goBack = () => {
  router.back()
}

const navigateToArticle = (nmId) => {
  const filters = {
    ...additionalFilters.value,
    dateFrom: additionalFilters.value.dateFrom || getDefaultDateFrom(),
    dateTo: additionalFilters.value.dateTo || getDefaultDateTo()
  }
  
  sessionStorage.setItem('dashboardFilters', JSON.stringify(filters))
  
  router.push({
    path: `/article/${nmId}`,
    query: { ...filters, articleId: nmId }
  })
}

const retryLoading = () => {
  const defaultFilters = {
    limit: 1000,
    page: 1,
    dateFrom: additionalFilters.value.dateFrom || getDefaultDateFrom(),
    dateTo: additionalFilters.value.dateTo || getDefaultDateTo(),
    nm_id: articleId.value,
    ...additionalFilters.value
  }
  
  loadBothPeriodsData(defaultFilters)
}

const exportToExcel = () => {
  alert('Экспорт в Excel будет реализован в следующей версии')
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

const getPreviousPeriodStart = () => {
  const from = additionalFilters.value.dateFrom || getDefaultDateFrom()
  const fromDate = new Date(from)
  fromDate.setDate(fromDate.getDate() - 7)
  return fromDate.toISOString().split('T')[0]
}

const getPreviousPeriodEnd = () => {
  const to = additionalFilters.value.dateTo || getDefaultDateTo()
  const toDate = new Date(to)
  toDate.setDate(toDate.getDate() - 7)
  return toDate.toISOString().split('T')[0]
}

// Обновляем данные при изменении API данных
watch([currentApiData, previousApiData], () => {
  currentPeriodData.value = currentApiData.value || []
  previousPeriodData.value = previousApiData.value || []
})

onMounted(() => {
  const savedFilters = sessionStorage.getItem('dashboardFilters')
  if (savedFilters) {
    const filters = JSON.parse(savedFilters)
    Object.assign(additionalFilters.value, filters)
  } else {
    Object.keys(additionalFilters.value).forEach(key => {
      if (route.query[key]) {
        additionalFilters.value[key] = route.query[key]
      }
    })
  }

  const defaultFilters = {
    limit: 1000,
    page: 1,
    dateFrom: additionalFilters.value.dateFrom || getDefaultDateFrom(),
    dateTo: additionalFilters.value.dateTo || getDefaultDateTo(),
    nm_id: articleId.value,
    ...additionalFilters.value
  }
  
  loadBothPeriodsData(defaultFilters)
})

// Следим за изменением артикула в URL
watch(() => route.params.articleId, (newArticleId) => {
  if (newArticleId) {
    retryLoading()
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 2rem;
}

.elegant-back {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #e2e8f0;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.elegant-back:hover {
  border-color: #ec4899;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.15) 100%);
  transform: translateX(-5px);
  box-shadow: 0 8px 30px rgba(239, 68, 68, 0.3);
}

.back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.elegant-back:hover .back-icon {
  transform: translateX(-3px);
}

.back-hover-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent);
  transition: left 0.6s ease;
}

.elegant-back:hover .back-hover-effect {
  left: 100%;
}

.title-section {
  flex: 1;
}

.page-title {
  margin: 0;
  color: #f1f5f9;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #ed80b6 0%, #f76dab 50%, #e72e7b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.title-subtitle {
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 400;
}

.elegant-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
  overflow: hidden;
  position: relative;
}

.elegant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #e86aa9, #f15299, #be185d);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
}

.card-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.5));
}

.card-title {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.4rem;
  font-weight: 600;
}

.article-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin: 2rem 0;
}

.article-info {
  display: flex;
  flex-direction: column;
}

.article-card {
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.elegant-image {
  width: calc(100% - 4rem); /* Учитываем отступы */
  margin: 1.5rem 2rem;
  height: 200px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 2px dashed rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  position: relative;
  transition: all 0.3s ease;
  text-align: center;
}

.elegant-image:hover {
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
}

.image-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}

.image-text {
  font-size: 1rem;
  text-align: center;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.article-code {
  font-size: 0.9rem;
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(15, 23, 42, 0.6);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.article-details {
  padding: 0 2rem 2rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.section-title {
  color: #f1f5f9;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(135deg, #e86aa9, #f15299);
  border-radius: 2px;
}

.detail-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.elegant-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.1);
  transition: all 0.3s ease;
}

.elegant-detail:hover {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
  transform: translateX(5px);
}

.detail-label {
  color: #94a3b8;
  font-weight: 500;
  font-size: 0.9rem;
}

.detail-value {
  color: #f1f5f9;
  font-weight: 600;
  font-size: 0.9rem;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.stats-section {
  margin-bottom: 2rem;
}

.elegant-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.stat-overview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.1);
  transition: all 0.3s ease;
}

.stat-overview:hover {
  border-color: rgba(239, 68, 68, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.15);
}

.stat-icon {
  font-size: 1.5rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ec4899;
  margin-bottom: 0.25rem;
  font-family: 'JetBrains Mono', monospace;
}

.stat-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.elegant-period {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.period-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.period-content {
  flex: 1;
}

.period-label {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.period-dates {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.metrics-table {
  display: flex;
  flex-direction: column;
}

.table-card {
  flex: 1;
}

.elegant-table-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: rgba(15, 23, 42, 0.4);
  border-bottom: 1px solid rgba(239, 68, 68, 0.1);
}

.records-count {
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-icon {
  font-size: 1.1rem;
}

.elegant-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Inter', sans-serif;
}

.elegant-button:not(.secondary) {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.elegant-button:not(.secondary):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
  background: linear-gradient(135deg, #db2777, #be185d);
}

.elegant-button.secondary {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #e2e8f0;
}

.elegant-button.secondary:hover {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

.table-container {
  padding: 0 2rem 2rem;
}

/* Стили для состояний загрузки и ошибок */
.loading-section, .error-section, .no-data-section {
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

.error-icon, .no-data-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.error-text {
  color: #fecaca;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.no-data-text {
  color: #f1f5f9;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

.no-data-subtext {
  color: #94a3b8;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.available-articles {
  background: rgba(30, 41, 59, 0.6);
  padding: 1.5rem;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  text-align: center;
  max-width: 500px;
}

.available-articles h4 {
  color: #f1f5f9;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.elegant-tag {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'JetBrains Mono', monospace;
}

.elegant-tag:hover {
  border-color: #ec4899;
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
  
  .article-card {
    position: static;
  }
  
  .elegant-stats {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .elegant-table-info {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

/* Стили для таблицы */
:deep(.metric-name) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #f1f5f9;
}

:deep(.metric-icon) {
  font-size: 1.1rem;
}

:deep(.metric-value) {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.4);
  text-align: center;
}

:deep(.metric-value.revenue) {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

:deep(.metric-value.discount) {
  color: #ec4899;
  background: rgba(236, 72, 153, 0.1);
}

:deep(.no-data) {
  color: #64748b;
  font-style: italic;
}

:deep(.data-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.data-table th) {
  background: rgba(30, 41, 59, 0.9) !important;
  border-bottom: 1px solid rgba(239, 68, 68, 0.2) !important;
  font-weight: 600;
  color: #f1f5f9 !important;
}

:deep(.data-table td) {
  border-bottom: 1px solid rgba(239, 68, 68, 0.1) !important;
  background: transparent !important;
}
</style>