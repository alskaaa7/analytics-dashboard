export default async function handler(req, res) {
  const { query } = req;
  
  try {
    const apiUrl = new URL('http://109.73.206.144:6969/api/orders');
    
    // Добавляем параметры
    Object.keys(query).forEach(key => {
      apiUrl.searchParams.append(key, query[key]);
    });
    
    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
};
