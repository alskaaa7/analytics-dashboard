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
        apiParams.append(key, value);
      }
    }

    // Добавляем API ключ
    if (!apiParams.has('key')) {
      apiParams.append('key', 'E6kUTYrYwZq2tN4QEtyzsbEBk3ie');
    }

    const apiUrl = `http://109.73.206.144:6969/api/${endpoint}?${apiParams.toString()}`;
    
    console.log('Proxying to:', apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from API',
      message: error.message 
    });
  }
}
