export default async function handler(req, res) {
  const { query } = req;
  
  try {
    // Создаем URL для API
    const apiUrl = 'http://109.73.206.144:6969/api/orders';
    const url = new URL(apiUrl);
    
    // Добавляем все query параметры
    Object.keys(query).forEach(key => {
      url.searchParams.append(key, query[key]);
    });
    
    console.log('Proxying to:', url.toString());
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Устанавливаем CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error: ' + error.message,
      details: 'Failed to fetch from API'
    });
  }
}
