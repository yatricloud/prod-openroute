const axios = require('axios');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, HTTP-Referer, X-Title',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { model, messages, stream, max_tokens } = JSON.parse(event.body);
    const apiKey = event.headers.authorization;
    
    if (!apiKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Authorization header is required'
        })
      };
    }

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model,
      messages,
      stream: false, // Netlify functions don't support streaming well
      max_tokens
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
        'HTTP-Referer': event.headers['http-referer'] || 'https://chat.yatricloud.com',
        'X-Title': event.headers['x-title'] || 'Chat Yatri'
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response.data)
    };

  } catch (error) {
    console.error('OpenRouter proxy error:', error.message);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.response?.data?.error?.message || error.message
      })
    };
  }
}; 