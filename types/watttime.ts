// WattTime API Types
export interface WattTimeRegistrationRequest {
  username: string
  password: string
  email: string
  org?: string
}

export interface WattTimeRegistrationResponse {
  success: boolean
  message?: string
  error?: string
}

export interface WattTimeLoginRequest {
  username: string
  password: string
}

export interface WattTimeLoginResponse {
  success?: boolean
  token?: string
  expires?: string
  message?: string
  error?: string
  status?: number
}

export interface WattTimeTokenInfo {
  token: string
  expires: string
  isValid: boolean
}

export interface WattTimeConnectionStatus {
  connected: boolean
  token?: string
  expires?: string
  lastChecked: Date
}

// Form validation types
export interface FormFieldError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: FormFieldError[]
}

// Application preferences types
export interface AppPreferences {
  darkMode: boolean
  autoRefresh: boolean
  refreshInterval: number
  defaultRegion?: string
}

// API response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
  status?: number
}

// Carbon intensity data types
export interface CarbonIntensityData {
  point_time: string
  value: number
}

export interface SignalIndexResponse {
  data: CarbonIntensityData[]
  meta: {
    region: string
    signal_type: string
    units: string
    data_point_period_seconds: number
    model?: {
      date: string
      type: string
    }
    warnings?: string[]
  }
}

export interface ForecastResponse {
  data: CarbonIntensityData[]
  meta: {
    region: string
    signal_type: string
    units: string
    data_point_period_seconds: number
    generated_at_period_seconds: number
  }
}

export interface RegionData {
  region: string
  name: string
  moer?: number
  aoer?: number
  lastUpdated?: string
  isLoading?: boolean
  error?: string
}

export interface DashboardRegion {
  id: string
  region: string
  name: string
  moer?: number
  aoer?: number
  lastUpdated?: string
  isLoading?: boolean
  error?: string
}

// Available regions for selection
export interface AvailableRegion {
  code: string
  name: string
  description?: string
}
