export default async function handler(request, response) {
  const { query } = request;
  const { endpoint, ...filters } = query;
  
  const searchParams = new URLSearchParams(filters);
  const apiUrl = `http://109.73.206.144:6969/api/${endpoint}?${searchParams}`;
  
  try {
    const apiResponse = await fetch(apiUrl);
    const data = await apiResponse.json();
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}