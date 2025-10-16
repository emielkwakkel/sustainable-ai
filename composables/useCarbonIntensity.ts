import type { 
  CarbonIntensityData, 
  SignalIndexResponse,
  ForecastResponse, 
  DashboardRegion, 
  AvailableRegion,
  ApiResponse 
} from '~/types/watttime'

export const useCarbonIntensity = () => {
  const { getTokenInfo } = useTokenManager()
  
  // Available regions for selection
  const availableRegions: AvailableRegion[] = [
    { code: 'CAISO_NORTH', name: 'California ISO North', description: 'Northern California' },
    { code: 'CAISO_SOUTH', name: 'California ISO South', description: 'Southern California' },
    { code: 'ERCOT', name: 'ERCOT', description: 'Texas' },
    { code: 'PJM', name: 'PJM', description: 'Mid-Atlantic' },
    { code: 'NYISO', name: 'NYISO', description: 'New York' },
    { code: 'ISO_NE', name: 'ISO New England', description: 'New England' },
    { code: 'MISO', name: 'MISO', description: 'Midwest' },
    { code: 'SPP', name: 'SPP', description: 'Southwest Power Pool' },
    { code: 'BPA', name: 'BPA', description: 'Pacific Northwest' },
    { code: 'IESO', name: 'IESO', description: 'Ontario, Canada' },
    { code: 'AESO', name: 'AESO', description: 'Alberta, Canada' },
    { code: 'DE', name: 'Germany', description: 'Germany' },
    { code: 'FR', name: 'France', description: 'France' },
    { code: 'GB', name: 'Great Britain', description: 'United Kingdom' },
    { code: 'NL', name: 'Netherlands', description: 'Netherlands' },
    { code: 'DK', name: 'Denmark', description: 'Denmark' },
    { code: 'SE', name: 'Sweden', description: 'Sweden' },
    { code: 'NO', name: 'Norway', description: 'Norway' },
    { code: 'FI', name: 'Finland', description: 'Finland' },
    { code: 'ES', name: 'Spain', description: 'Spain' },
    { code: 'IT', name: 'Italy', description: 'Italy' },
    { code: 'AU_NSW', name: 'Australia NSW', description: 'New South Wales' },
    { code: 'AU_VIC', name: 'Australia VIC', description: 'Victoria' },
    { code: 'AU_QLD', name: 'Australia QLD', description: 'Queensland' },
    { code: 'AU_SA', name: 'Australia SA', description: 'South Australia' },
    { code: 'AU_WA', name: 'Australia WA', description: 'Western Australia' },
    { code: 'AU_TAS', name: 'Australia TAS', description: 'Tasmania' }
  ]

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
      const response = await $fetch<SignalIndexResponse>('/api/watttime/current-intensity', {
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
      const response = await $fetch<ForecastResponse>('/api/watttime/forecast', {
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
