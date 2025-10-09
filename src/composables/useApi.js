import { ref } from 'vue'

export function useApi(endpoint = 'orders') {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const params = {
        limit: 100,
        ...filters
      }

      // Очистка параметров
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      // Всегда используем Vercel proxy в production и development
      const apiUrl = `/api/proxy?${new URLSearchParams({
        ...params,
        endpoint: endpoint
      })}`;

      console.log('API Request to:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Если есть ошибка от API
      if (result.error) {
        throw new Error(result.message || result.error);
      }

      // Обработка данных
      let extractedData = [];
      if (result?.data) extractedData = result.data;
      else if (result?.orders) extractedData = result.orders;
      else if (Array.isArray(result)) extractedData = result;
      else if (result) extractedData = [result];

      // Нормализация
      data.value = extractedData.map(item => ({
        ...item,
        total_price: Number(item.total_price) || 0,
        discount_percent: Number(item.discount_percent) || 0,
        quantity: Number(item.quantity) || 1,
        is_cancel: Boolean(item.is_cancel),
        nm_id: item.nm_id ? item.nm_id.toString() : null,
        date: item.date || item.created_at || new Date().toISOString()
      })).filter(item => item.nm_id);
      
      console.log(`Loaded ${data.value.length} items`);
      
    } catch (err) {
      error.value = `Ошибка загрузки данных: ${err.message}`;
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
