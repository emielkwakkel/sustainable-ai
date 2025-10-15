export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password, email, org } = body

  if (!username || !password || !email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username, password, and email are required'
    })
  }

  try {
    const response = await $fetch('https://api.watttime.org/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sustainable-AI-Dashboard/1.0'
      },
      body: {
        username,
        password,
        email,
        org
      },
      // Disable SSL verification for development only
      rejectUnauthorized: false
    }) as any

    console.log('Server: WattTime registration response:', response)
    
    // The WattTime API returns success info
    if (response && response.ok) {
      return {
        success: true,
        message: 'Account registered successfully'
      }
    }
    
    return {
      success: false,
      error: response.error || 'Registration failed'
    }
  } catch (error: any) {
    console.error('WattTime registration error:', error)
    
    throw createError({
      statusCode: error.status || 400,
      statusMessage: error.data?.message || error.message || 'Registration failed'
    })
  }
})
