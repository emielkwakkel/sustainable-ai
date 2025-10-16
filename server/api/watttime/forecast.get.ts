export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { region, hours = 0, token } = query

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
    // Get forecast data
    const response = await $fetch('https://api.watttime.org/v3/forecast', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      query: {
        region,
        signal_type: 'co2_moer',
        horizon_hours: hours
      },
      // Disable SSL verification for development only
      rejectUnauthorized: false
    })

    return response
  } catch (error: any) {
    console.error('WattTime forecast error:', error)
    
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.data?.message || error.message || 'Failed to fetch forecast data'
    })
  }
})
