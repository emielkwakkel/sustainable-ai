import type { WattTimeTokenInfo, WattTimeConnectionStatus, ConnectionStatus, CursorConnectionStatus } from '~/types/watttime'

const TOKEN_STORAGE_KEY = 'watttime_token'
const TOKEN_EXPIRY_STORAGE_KEY = 'watttime_token_expires'

export const useTokenManager = () => {
  // Import API health composable
  const { apiHealth, checkApiHealth } = useApiHealth()
  
  // Reactive state for WattTime connection status
  const watttimeStatus = ref<WattTimeConnectionStatus>({
    connected: false,
    lastChecked: new Date()
  })

  // Reactive state for Cursor API connection status
  const cursorStatus = ref<CursorConnectionStatus>({
    connected: false
  })

  // Combined connection status
  const connectionStatus = computed<ConnectionStatus>(() => ({
    watttime: watttimeStatus.value,
    api: apiHealth.value,
    cursor: cursorStatus.value,
    overall: watttimeStatus.value.connected && apiHealth.value.healthy && cursorStatus.value.connected
  }))

  // Check if token exists and is valid
  const isTokenValid = (): boolean => {
    if (typeof window !== 'undefined') {
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
    if (typeof window !== 'undefined' && isTokenValid()) {
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
      localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expires)
      
      // Update WattTime connection status
      watttimeStatus.value = {
        connected: true,
        token,
        expires,
        lastChecked: new Date()
      }
    }
  }

  // Remove token (logout)
  const removeToken = (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
      
      // Update WattTime connection status
      watttimeStatus.value = {
        connected: false,
        lastChecked: new Date()
      }
    }
  }

  // Check WattTime connection status
  const checkWattTimeStatus = async (): Promise<WattTimeConnectionStatus> => {
    const tokenInfo = getTokenInfo()
    
    if (tokenInfo && tokenInfo.isValid) {
      watttimeStatus.value = {
        connected: true,
        token: tokenInfo.token,
        expires: tokenInfo.expires,
        lastChecked: new Date()
      }
    } else {
      watttimeStatus.value = {
        connected: false,
        lastChecked: new Date()
      }
    }
    
    return watttimeStatus.value
  }

  // Check Cursor API connection status
  const checkCursorStatus = (): CursorConnectionStatus => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('cursor_api_token')
      cursorStatus.value = {
        connected: token !== null,
        lastTest: token ? new Date().toISOString() : undefined
      }
    } else {
      cursorStatus.value = {
        connected: false
      }
    }
    
    return cursorStatus.value
  }

  // Check both connection statuses
  const checkConnectionStatus = async (): Promise<ConnectionStatus> => {
    await Promise.all([
      checkWattTimeStatus(),
      checkApiHealth()
    ])
    
    // Check Cursor status synchronously
    checkCursorStatus()
    
    return connectionStatus.value
  }

  // Initialize connection status on composable creation
  if (typeof window !== 'undefined') {
    checkConnectionStatus()
  }

  return {
    connectionStatus: readonly(connectionStatus),
    watttimeStatus: readonly(watttimeStatus),
    apiHealth: readonly(apiHealth),
    cursorStatus: readonly(cursorStatus),
    isTokenValid,
    getTokenInfo,
    storeToken,
    removeToken,
    checkConnectionStatus,
    checkWattTimeStatus,
    checkApiHealth,
    checkCursorStatus
  }
}
