const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { query } = req;
    console.log('Proxying request with params:', query);
    
    // Строим URL для API
    const apiUrl = 'http://109.73.206.144:6969/api/orders';
    const url = new URL(apiUrl);
    
    // Добавляем все параметры
    Object.keys(query).forEach(key => {
      if (query[key]) {
        url.searchParams.append(key, query[key]);
      }
    });
    
    // Добавляем API ключ если его нет
    if (!query.key) {
      url.searchParams.append('key', 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie');
    }
    
    console.log('Fetching from:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch from API server'
    });
  }
};
