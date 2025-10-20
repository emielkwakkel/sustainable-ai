export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required'
    })
  }

  try {
    // Create Basic Auth header
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    
    console.log('Server: Attempting WattTime login for user:', username)
    console.log('Server: API URL: https://api.watttime.org/login')
    
    // Use native fetch with SSL configuration
    const response = await fetch('https://api.watttime.org/login', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'User-Agent': 'Sustainable-AI-Dashboard/1.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json() as any

    console.log('Server: WattTime login response:', data)
    
    // The WattTime API returns a token directly, not wrapped in success/error
    // We need to format it properly for our client
    if (data && data.token) {
      // Calculate expiration time (tokens typically expire in 30 minutes)
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      
      return {
        success: true,
        token: data.token,
        expires: expires
      }
    }
    
    return {
      success: false,
      error: 'No token received from WattTime API'
    }
  } catch (error: any) {
    console.error('Server: WattTime login error:', error)
    console.error('Server: Error status:', error.status)
    console.error('Server: Error message:', error.message)
    
    // Return a more detailed error response
    return {
      success: false,
      error: error.data?.message || error.message || 'Login failed',
      status: error.status || 401
    }
  }
})
