import { ref } from 'vue'

export function useApi(endpoint) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = {
        key: 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie',
        limit: 100,
        ...filters
      }

      // Убираем пустые параметры
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      // Используем API route
      const url = `/api?${new URLSearchParams(params)}`;
      console.log('API Request to:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Обрабатываем ответ
      let extractedData = [];
      if (result && typeof result === 'object') {
        if (result.data && Array.isArray(result.data)) {
          extractedData = result.data;
        } else if (Array.isArray(result.orders)) {
          extractedData = result.orders;
        } else if (Array.isArray(result)) {
          extractedData = result;
        } else if (result.error) {
          throw new Error(result.error);
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
      })).filter(item => item.nm_id);
      
    } catch (err) {
      error.value = `API Error: ${err.message}`;
      data.value = [];
      console.error('API Error:', err);
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    loading,
    error,
    fetchData
  }
}
