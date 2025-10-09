import { ref } from 'vue'

const isProduction = import.meta.env.PROD

export function useApi(endpoint) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      let url
      
      if (isProduction) {
        // В production используем прокси
        url = `/api/proxy?${new URLSearchParams(filters)}`
      } else {
        // В development используем прямое подключение
        const params = {
          key: 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie',
          ...filters
        }
        url = `http://109.73.206.144:6969/api/${endpoint}?${new URLSearchParams(params)}`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Извлекаем данные из разных форматов ответа
      let extractedData = []
      if (result && typeof result === 'object') {
        if (result.data && Array.isArray(result.data)) {
          extractedData = result.data
        } else if (Array.isArray(result.orders)) {
          extractedData = result.orders
        } else if (Array.isArray(result)) {
          extractedData = result
        }
      }

      // Нормализация данных
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
      data.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    fetchData
  }
}
