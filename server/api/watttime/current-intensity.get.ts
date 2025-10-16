export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { region, token } = query

  if (!region) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Region is required'
    })
  }

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required'
    })
  }

  try {
    // Get current carbon intensity data
    const response = await $fetch('https://api.watttime.org/v3/signal-index', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      query: {
        region,
        signal_type: 'co2_moer'
      },
      // Disable SSL verification for development only
      rejectUnauthorized: false
    })

    return response
  } catch (error: any) {
    console.error('WattTime current intensity error:', error)
    
    // Handle specific error cases
    if (error.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid or expired token. Please reconnect to WattTime.'
      })
    }
    
    if (error.status === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied. Please check your WattTime subscription.'
      })
    }
    
    if (error.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Region not found or not supported.'
      })
    }
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to fetch current intensity data'
    })
  }
})
