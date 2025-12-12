import type { 
  CarbonIntensityData, 
  SignalIndexResponse,
  ForecastResponse, 
  DashboardRegion, 
  AvailableRegion,
  ApiResponse 
} from '~/types/watttime'

import { useTokenManager } from '~/composables/useTokenManager'
import { availableRegions } from '@susai/config'

export const useCarbonIntensity = () => {
  const { getTokenInfo } = useTokenManager()
  
  // API base URL - use the API package server with HTTPS
  const API_BASE_URL = 'https://localhost:3001/api'

  // Get current carbon intensity for a region
  const getCurrentIntensity = async (region: string): Promise<ApiResponse<CarbonIntensityData>> => {
    const tokenInfo = getTokenInfo()
    
    if (!tokenInfo || !tokenInfo.isValid) {
      return {
        success: false,
        error: 'No valid token found. Please connect to WattTime in Settings.',
        status: 401
      }
    }

    try {
      const response = await $fetch<SignalIndexResponse>(`${API_BASE_URL}/watttime/current-intensity`, {
        method: 'GET',
        query: { 
          region,
          token: tokenInfo.token
        }
      })

      // Extract the first data point (current value)
      const currentData = response.data?.[0]
      if (!currentData) {
        return {
          success: false,
          error: 'No data available for this region',
          status: 404
        }
      }

      return {
        data: currentData,
        success: true
      }
    } catch (error: any) {
      console.error('Carbon intensity fetch error:', error)
      
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch carbon intensity data',
        status: error.status || 500
      }
    }
  }

  // Get forecast data for a region
  const getForecast = async (region: string, hours: number = 24): Promise<ApiResponse<ForecastResponse>> => {
    const tokenInfo = getTokenInfo()
    
    if (!tokenInfo || !tokenInfo.isValid) {
      return {
        success: false,
        error: 'No valid token found. Please connect to WattTime in Settings.',
        status: 401
      }
    }

    try {
      const response = await $fetch<ForecastResponse>(`${API_BASE_URL}/watttime/forecast`, {
        method: 'GET',
        query: { 
          region,
          hours,
          token: tokenInfo.token
        }
      })

      return {
        data: response,
        success: true
      }
    } catch (error: any) {
      console.error('Forecast fetch error:', error)
      
      return {
        success: false,
        error: error.data?.message || error.message || 'Failed to fetch forecast data',
        status: error.status || 500
      }
    }
  }

  // Calculate color based on carbon intensity percentile
  const getIntensityColor = (percentile: number): string => {
    if (percentile <= 33) return 'red'
    if (percentile <= 66) return 'orange'
    return 'green'
  }

  // Get intensity level description
  const getIntensityLevel = (percentile: number): string => {
    if (percentile <= 33) return 'High carbon intensity'
    if (percentile <= 66) return 'Moderate carbon intensity'
    return 'Low carbon intensity'
  }

  return {
    availableRegions,
    getCurrentIntensity,
    getForecast,
    getIntensityColor,
    getIntensityLevel
  }
}
