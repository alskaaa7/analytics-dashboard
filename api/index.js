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
    
    // Добавляем параметры
    Object.keys(query).forEach(key => {
      if (query[key] !== undefined && query[key] !== '') {
        url.searchParams.append(key, query[key]);
      }
    });
    
    // Добавляем API ключ если нет
    if (!query.key) {
      url.searchParams.append('key', 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie');
    }
    
    console.log('Proxying to:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to fetch from API'
    });
  }
};
