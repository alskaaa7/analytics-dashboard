import { ref } from 'vue'

export function useApi(endpoint = 'orders') {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchData = async (filters = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // Базовые параметры
      const params = {
        limit: filters.limit || 1000,
        ...filters
      }

      // Очистка параметров от пустых значений
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || params[key] === null) {
          delete params[key];
        }
      });

      // Убираем параметры которые не нужны API
      delete params.page; // Убираем пагинацию если API ее не поддерживает

      // Всегда используем Vercel proxy
      const apiUrl = `/api/proxy?${new URLSearchParams({
        ...params,
        endpoint: endpoint
      })}`;

      console.log('📡 API Request:', { endpoint, params, url: apiUrl });

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('❌ API Error Response:', errorData);
        } catch {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Если есть ошибка от API
      if (result.error) {
        throw new Error(result.message || result.error);
      }

      // Обработка различных форматов ответа
      let extractedData = [];
      if (result?.data) extractedData = result.data;
      else if (result?.orders) extractedData = result.orders;
      else if (result?.results) extractedData = result.results;
      else if (Array.isArray(result)) extractedData = result;
      else if (result && typeof result === 'object') extractedData = [result];

      // Нормализация данных
      data.value = extractedData.map(item => ({
        ...item,
        total_price: Number(item.total_price) || 0,
        discount_percent: Number(item.discount_percent) || 0,
        quantity: Number(item.quantity) || 1,
        is_cancel: Boolean(item.is_cancel),
        nm_id: item.nm_id ? item.nm_id.toString() : null,
        date: item.date || item.created_at || item.order_date || new Date().toISOString().split('T')[0],
        subject: item.subject || item.name || item.product_name || 'Неизвестный товар',
        brand: item.brand || 'Неизвестный бренд',
        category: item.category || 'Неизвестная категория'
      })).filter(item => item.nm_id);
      
      console.log(`✅ Loaded ${data.value.length} ${endpoint} items`);
      
      if (data.value.length === 0) {
        console.warn('⚠️ No data received from API');
      }
      
    } catch (err) {
      error.value = `Ошибка загрузки данных: ${err.message}`;
      data.value = [];
      console.error('❌ API Error:', err.message);
      
      // Для отладки
      if (err.message.includes('Failed to fetch')) {
        error.value = 'Не удалось подключиться к серверу. Проверьте подключение к интернету.';
      } else if (err.message.includes('timeout')) {
        error.value = 'Превышено время ожидания ответа от сервера.';
      } else if (err.message.includes('400')) {
        error.value = 'Неверный запрос к API. Проверьте параметры фильтрации.';
      } else if (err.message.includes('500')) {
        error.value = 'Ошибка на сервере API. Попробуйте позже.';
      }
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
