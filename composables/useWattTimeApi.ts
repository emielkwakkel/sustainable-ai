import type { 
  WattTimeRegistrationRequest, 
  WattTimeRegistrationResponse,
  WattTimeLoginRequest,
  WattTimeLoginResponse,
  ApiResponse 
} from '~/types/watttime'

export const useWattTimeApi = () => {
  const config = useRuntimeConfig()
  const { storeToken } = useTokenManager()

  // Registration function
  const register = async (request: WattTimeRegistrationRequest): Promise<ApiResponse<WattTimeRegistrationResponse>> => {
    try {
      const response = await $fetch<WattTimeRegistrationResponse>(`${config.public.wattTimeApiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request
      })

      return {
        data: response,
        success: true
      }
    } catch (error: any) {
      console.error('WattTime registration error:', error)
      
      return {
        success: false,
        error: error.data?.message || error.message || 'Registration failed. Please try again.',
        status: error.status || 500
      }
    }
  }

  // Login function
  const login = async (request: WattTimeLoginRequest): Promise<ApiResponse<WattTimeLoginResponse>> => {
    try {
      const response = await $fetch<WattTimeLoginResponse>(`${config.public.wattTimeApiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: request
      })

      // Store token if login successful
      if (response.success && response.token && response.expires) {
        storeToken(response.token, response.expires)
      }

      return {
        data: response,
        success: true
      }
    } catch (error: any) {
      console.error('WattTime login error:', error)
      
      return {
        success: false,
        error: error.data?.message || error.message || 'Login failed. Please check your credentials.',
        status: error.status || 500
      }
    }
  }

  // Test connection with existing token
  const testConnection = async (): Promise<ApiResponse<{ connected: boolean }>> => {
    const { getTokenInfo } = useTokenManager()
    const tokenInfo = getTokenInfo()

    if (!tokenInfo || !tokenInfo.isValid) {
      return {
        success: false,
        error: 'No valid token found',
        data: { connected: false }
      }
    }

    try {
      // Test the connection by making a simple API call
      // This would be a lightweight endpoint to verify the token
      const response = await $fetch(`${config.public.wattTimeApiUrl}/v2/ba`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenInfo.token}`,
          'Content-Type': 'application/json',
        }
      })

      return {
        success: true,
        data: { connected: true }
      }
    } catch (error: any) {
      console.error('WattTime connection test error:', error)
      
      return {
        success: false,
        error: error.data?.message || error.message || 'Connection test failed',
        data: { connected: false },
        status: error.status || 500
      }
    }
  }

  return {
    register,
    login,
    testConnection
  }
}
