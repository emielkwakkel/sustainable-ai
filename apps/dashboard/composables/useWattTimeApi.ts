import type { 
  WattTimeRegistrationRequest, 
  WattTimeRegistrationResponse,
  WattTimeLoginRequest,
  WattTimeLoginResponse,
  ApiResponse 
} from '~/types/watttime'

import { useTokenManager } from '~/composables/useTokenManager'

export const useWattTimeApi = () => {
  const config = useRuntimeConfig()
  const { storeToken } = useTokenManager()

  // Registration function
  const register = async (request: WattTimeRegistrationRequest): Promise<ApiResponse<WattTimeRegistrationResponse>> => {
    try {
      const response = await $fetch<WattTimeRegistrationResponse>('/api/watttime/register', {
        method: 'POST',
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
      console.log('Attempting WattTime login for user:', request.username)
      
      const response = await $fetch<WattTimeLoginResponse>('/api/watttime/login', {
        method: 'POST',
        body: request
      })

      console.log('WattTime login response:', response)

      // Check if the response indicates failure
      if (response && response.success === false) {
        return {
          success: false,
          error: response.error || 'Login failed. Please check your credentials.',
          status: (response as any).status || 401
        }
      }

      // Store token if login successful
      if (response && response.token && response.expires) {
        storeToken(response.token, response.expires)
        console.log('Token stored successfully')
      }

      return {
        data: response,
        success: true
      }
    } catch (error: any) {
      console.error('WattTime login error:', error)
      console.error('Error status:', error.status)
      console.error('Error data:', error.data)
      
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
      // Test the connection using server-side proxy
      const response = await $fetch<{ connected: boolean }>('/api/watttime/test-connection', {
        method: 'GET',
        query: { token: tokenInfo.token }
      })

      return {
        success: true,
        data: { connected: response.connected }
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
