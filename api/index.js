const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
  // Простые CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const { query } = req;
    
    // Базовые параметры
    const params = {
      key: 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie',
      limit: '100',
      ...query
    };
    
    // Добавляем даты если нет
    if (!params.dateFrom) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.dateFrom = weekAgo.toISOString().split('T')[0];
    }
    
    if (!params.dateTo) {
      params.dateTo = new Date().toISOString().split('T')[0];
    }
    
    // Строим URL
    const apiUrl = 'http://109.73.206.144:6969/api/orders';
    const url = new URL(apiUrl);
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    console.log('Fetching:', url.toString());
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
};
