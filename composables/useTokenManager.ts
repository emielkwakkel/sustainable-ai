import type { WattTimeTokenInfo, WattTimeConnectionStatus } from '~/types/watttime'

const TOKEN_STORAGE_KEY = 'watttime_token'
const TOKEN_EXPIRY_STORAGE_KEY = 'watttime_token_expires'

export const useTokenManager = () => {
  // Reactive state for connection status
  const connectionStatus = ref<WattTimeConnectionStatus>({
    connected: false,
    lastChecked: new Date()
  })

  // Check if token exists and is valid
  const isTokenValid = (): boolean => {
    if (import.meta.client) {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      const expires = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY)
      
      if (!token || !expires) {
        return false
      }
      
      const expiryDate = new Date(expires)
      const now = new Date()
      
      return expiryDate > now
    }
    return false
  }

  // Get stored token info
  const getTokenInfo = (): WattTimeTokenInfo | null => {
    if (import.meta.client && isTokenValid()) {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY)
      const expires = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY)
      
      if (token && expires) {
        return {
          token,
          expires,
          isValid: true
        }
      }
    }
    return null
  }

  // Store token securely
  const storeToken = (token: string, expires: string): void => {
    if (import.meta.client) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expires)
      
      // Update connection status
      connectionStatus.value = {
        connected: true,
        token,
        expires,
        lastChecked: new Date()
      }
    }
  }

  // Remove token (logout)
  const removeToken = (): void => {
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
      
      // Update connection status
      connectionStatus.value = {
        connected: false,
        lastChecked: new Date()
      }
    }
  }

  // Check connection status
  const checkConnectionStatus = async (): Promise<WattTimeConnectionStatus> => {
    const tokenInfo = getTokenInfo()
    
    if (tokenInfo && tokenInfo.isValid) {
      connectionStatus.value = {
        connected: true,
        token: tokenInfo.token,
        expires: tokenInfo.expires,
        lastChecked: new Date()
      }
    } else {
      connectionStatus.value = {
        connected: false,
        lastChecked: new Date()
      }
    }
    
    return connectionStatus.value
  }

  // Initialize connection status on composable creation
  if (import.meta.client) {
    checkConnectionStatus()
  }

  return {
    connectionStatus: readonly(connectionStatus),
    isTokenValid,
    getTokenInfo,
    storeToken,
    removeToken,
    checkConnectionStatus
  }
}
