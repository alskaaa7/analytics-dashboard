export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const endpoint = searchParams.get('endpoint') || 'orders';
    
    const apiParams = new URLSearchParams();
    
    // Копируем все query параметры кроме endpoint
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'endpoint' && value !== undefined && value !== null && value !== '') {
        // Преобразуем даты в правильный формат если нужно
        if (key === 'dateFrom' || key === 'dateTo') {
          // Убедимся что дата в правильном формате YYYY-MM-DD
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            apiParams.append(key, date.toISOString().split('T')[0]);
          } else {
            apiParams.append(key, value);
          }
        } else {
          apiParams.append(key, value);
        }
      }
    }

    // Добавляем API ключ
    if (!apiParams.has('key')) {
      apiParams.append('key', 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie');
    }

    const apiUrl = `http://109.73.206.144:6969/api/${endpoint}?${apiParams.toString()}`;
    
    console.log('🔁 Proxying request to:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Analytics-Dashboard/1.0',
        'Accept': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = await response.text();
      console.error(`❌ API Error ${response.status}:`, errorText);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`✅ Successfully proxied ${endpoint}, got ${Array.isArray(data) ? data.length : 'some'} items`);
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    
    if (error.name === 'AbortError') {
      res.status(504).json({ 
        error: 'Timeout',
        message: 'API request timed out after 30 seconds'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch data from API',
        message: error.message,
        suggestion: 'Check API server status and parameters'
      });
    }
  }
}
