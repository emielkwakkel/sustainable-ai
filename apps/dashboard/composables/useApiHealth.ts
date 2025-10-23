import type { ApiHealthStatus } from '~/types/watttime'

const API_BASE_URL = 'https://localhost:3001'

export const useApiHealth = () => {
  // Reactive state for API health
  const apiHealth = ref<ApiHealthStatus>({
    healthy: false,
    lastChecked: new Date()
  })

  // Check API health
  const checkApiHealth = async (): Promise<ApiHealthStatus> => {
    try {
      const response = await $fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
        retry: 1 // Only retry once
      }) as any

      if (response.success && response.data) {
        apiHealth.value = {
          healthy: response.data.status === 'healthy',
          lastChecked: new Date(),
          version: response.data.version,
          uptime: response.data.uptime,
          environment: response.data.environment
        }
      } else {
        apiHealth.value = {
          healthy: false,
          lastChecked: new Date(),
          error: 'API returned unhealthy status'
        }
      }
    } catch (error: any) {
      console.error('API health check failed:', error)
      apiHealth.value = {
        healthy: false,
        lastChecked: new Date(),
        error: error.message || 'Failed to connect to API'
      }
    }

    return apiHealth.value
  }

  // Initialize API health check on composable creation
  if (typeof window !== 'undefined') {
    checkApiHealth()
  }

  return {
    apiHealth: readonly(apiHealth),
    checkApiHealth
  }
}
