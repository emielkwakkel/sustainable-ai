import { Router } from 'express'
import https from 'https'

const router = Router()

// WattTime login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    })
  }

  try {
    // Create Basic Auth header
    const credentials = Buffer.from(`${username}:${password}`).toString('base64')
    
    console.log('API: Attempting WattTime login for user:', username)
    console.log('API: API URL: https://api.watttime.org/login')
    
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

    console.log('API: WattTime login response:', data)
    
    // The WattTime API returns a token directly, not wrapped in success/error
    // We need to format it properly for our client
    if (data && data.token) {
      // Calculate expiration time (tokens typically expire in 30 minutes)
      const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      
      return res.json({
        success: true,
        token: data.token,
        expires: expires
      })
    }
    
    return res.json({
      success: false,
      error: 'No token received from WattTime API'
    })
  } catch (error: any) {
    console.error('API: WattTime login error:', error)
    console.error('API: Error status:', error.status)
    console.error('API: Error message:', error.message)
    
    // Return a more detailed error response
    return res.status(500).json({
      success: false,
      error: error.data?.message || error.message || 'Login failed',
      status: error.status || 401
    })
  }
})

// WattTime registration endpoint
router.post('/register', async (req, res) => {
  const { username, password, email, org } = req.body

  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      error: 'Username, password, and email are required'
    })
  }

  try {
    const response = await fetch('https://api.watttime.org/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sustainable-AI-Dashboard/1.0'
      },
      body: JSON.stringify({
        username,
        password,
        email,
        org
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json() as any

    console.log('API: WattTime registration response:', data)
    
    // The WattTime API returns success info
    if (data && data.ok) {
      return res.json({
        success: true,
        message: 'Account registered successfully'
      })
    }
    
    return res.json({
      success: false,
      error: data.error || 'Registration failed'
    })
  } catch (error: any) {
    console.error('API: WattTime registration error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.data?.message || error.message || 'Registration failed'
    })
  }
})

// WattTime current intensity endpoint
router.get('/current-intensity', async (req, res) => {
  const { region, token } = req.query

  if (!region) {
    return res.status(400).json({
      success: false,
      error: 'Region is required'
    })
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    })
  }

  try {
    // Get current carbon intensity data
    const response = await fetch(`https://api.watttime.org/v3/signal-index?region=${region}&signal_type=co2_moer`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return res.json(data)
  } catch (error: any) {
    console.error('API: WattTime current intensity error:', error)
    
    // Handle specific error cases
    if (error.message.includes('401')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token. Please reconnect to WattTime.'
      })
    }
    
    if (error.message.includes('403')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Please check your WattTime subscription.'
      })
    }
    
    if (error.message.includes('404')) {
      return res.status(404).json({
        success: false,
        error: 'Region not found or not supported.'
      })
    }
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch current intensity data'
    })
  }
})

// WattTime forecast endpoint
router.get('/forecast', async (req, res) => {
  const { region, hours = 0, token } = req.query

  if (!region) {
    return res.status(400).json({
      success: false,
      error: 'Region is required'
    })
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    })
  }

  try {
    // Get forecast data
    const response = await fetch(`https://api.watttime.org/v3/forecast?region=${region}&signal_type=co2_moer&horizon_hours=${hours}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return res.json(data)
  } catch (error: any) {
    console.error('API: WattTime forecast error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch forecast data'
    })
  }
})

// WattTime test connection endpoint
router.get('/test-connection', async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    })
  }

  try {
    const response = await fetch('https://api.watttime.org/v3/my-access', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return res.json({
      connected: true,
      data: data
    })
  } catch (error: any) {
    console.error('API: WattTime connection test error:', error)
    
    return res.json({
      connected: false,
      error: error.message || 'Connection test failed'
    })
  }
})

export { router as watttimeRoutes }
