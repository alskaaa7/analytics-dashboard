const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query } = req;
    
    // Строим URL для API
    const baseUrl = 'http://109.73.206.144:6969/api/orders';
    const url = new URL(baseUrl);
    
    // Добавляем обязательные параметры
    const params = {
      key: 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie',
      ...query
    };
    
    // Добавляем даты если их нет
    if (!params.dateFrom) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.dateFrom = weekAgo.toISOString().split('T')[0];
    }
    
    if (!params.dateTo) {
      params.dateTo = new Date().toISOString().split('T')[0];
    }
    
    // Добавляем лимит если нет
    if (!params.limit) {
      params.limit = '100';
    }
    
    // Добавляем все параметры
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '') {
        url.searchParams.append(key, params[key]);
      }
    });
    
    console.log('Proxying to:', url.toString());
    
    const response = await fetch(url.toString());
    const responseText = await response.text();
    
    // Проверяем если ответ HTML (ошибка)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      throw new Error('API returned HTML instead of JSON');
    }
    
    // Парсим JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'API server error'
    });
  }
};
