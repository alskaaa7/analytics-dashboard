import { ref } from 'vue'

const API_BASE_URL = 'http://109.73.206.144:6969'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

export function useApi(endpoint) {
  const data = ref([]) // ФИКС: по умолчанию пустой массив
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = { 
        key: API_KEY, 
        limit: 100,
        ...filters 
      }

      // Убираем пустые параметры
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const url = `${API_BASE_URL}/api/${endpoint}?${new URLSearchParams(params)}`
      console.log('Fetching:', url) // Для отладки
      
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 429) {
          // Ждем 5 секунд при лимите
          await new Promise(resolve => setTimeout(resolve, 5000))
          return fetchData(filters) // Рекурсивный вызов
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Извлекаем данные
      let extractedData = []
      if (result?.data) extractedData = result.data
      else if (result?.orders) extractedData = result.orders  
      else if (Array.isArray(result)) extractedData = result

      // Нормализация
      data.value = extractedData.map(item => ({
        ...item,
        total_price: Number(item.total_price) || 0,
        discount_percent: Number(item.discount_percent) || 0,
        quantity: Number(item.quantity) || 1,
        is_cancel: Boolean(item.is_cancel),
        nm_id: item.nm_id ? item.nm_id.toString() : null
      })).filter(item => item.nm_id)

    } catch (err) {
      error.value = err.message
      data.value = [] // Всегда возвращаем массив
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, fetchData }
}