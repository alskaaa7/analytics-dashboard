import { ref } from 'vue'

const API_HOST = 'http://109.73.206.144:6969'
const API_KEY = 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie'

export function useApi(endpoint) {
  const data = ref([])
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({})

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    data.value = []
    
    try {
      const params = new URLSearchParams({
        key: API_KEY
      })

      if (filters.limit) params.append('limit', filters.limit)
      if (filters.page) params.append('page', filters.page)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo && endpoint !== 'stocks') params.append('dateTo', filters.dateTo)

      const url = `${API_HOST}/api/${endpoint}?${params}`
      console.log('API URL:', url)

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('API Response:', result)

      if (Array.isArray(result)) {
        data.value = result
      } else if (result.data && Array.isArray(result.data)) {
        data.value = result.data
      } else {
        data.value = []
      }

      if (result.meta) {
        pagination.value = result.meta
      } else {
        pagination.value = {
          current_page: filters.page || 1,
          total: data.value.length,
          last_page: 1
        }
      }

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
    pagination,
    fetchData
  }
}