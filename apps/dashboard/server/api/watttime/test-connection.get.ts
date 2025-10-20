export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { token } = query

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required'
    })
  }

  try {
    const response = await $fetch('https://api.watttime.org/v3/my-access', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      // Disable SSL verification for development only
      rejectUnauthorized: false
    })

    return {
      connected: true,
      data: response
    }
  } catch (error: any) {
    console.error('WattTime connection test error:', error)
    
    return {
      connected: false,
      error: error.data?.message || error.message || 'Connection test failed'
    }
  }
})
