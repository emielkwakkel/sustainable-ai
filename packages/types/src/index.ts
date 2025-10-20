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

// Token Calculator Types
export interface AIModel {
  id: string
  name: string
  parameters: number // in billions
  contextLength: number
  contextWindow: number
  complexityFactor: number // relative to GPT-3 (1.0 = GPT-3 baseline)
}

export interface HardwareConfig {
  id: string
  name: string
  powerConsumption: number // watts
  tokensPerSecond: number
  efficiency: number // tokens per watt
}

export interface DataCenterProvider {
  id: string
  name: string
  regions: DataCenterRegion[]
}

export interface DataCenterRegion {
  id: string
  name: string
  region: string
  pue: number // Power Usage Effectiveness
  carbonIntensity: number // kg CO₂/kWh
}

export interface TokenCalculatorState {
  model: string
  tokenCount: number
  contextLength: number
  contextWindow: number
  hardware: string
  dataCenter: string
  pue: number
  carbonIntensity: number
}

export interface CalculationResult {
  energyJoules: number
  energyKWh: number
  carbonEmissionsGrams: number
  totalEmissionsGrams: number
  equivalentLightbulbMinutes: number
  equivalentCarMiles: number
  equivalentTreeHours: number
}

export interface TokenCalculatorFormData {
  tokenCount: number
  model: string
  contextLength: number
  contextWindow: number
  hardware: string
  dataCenterProvider: string
  dataCenterRegion: string
  customPue?: number
  customCarbonIntensity?: number
}

// Preset Types
export interface TokenCalculatorPreset {
  id: string
  name: string
  isDefault: boolean
  description?: string
  configuration: TokenCalculatorFormData
  createdAt: string
  updatedAt: string
}

// CLI Types
export interface CLICalculationOptions {
  tokens: number
  model: string
  hardware?: string
  datacenter?: string
  region?: string
  pue?: number
  carbonIntensity?: number
  output?: 'json' | 'table' | 'csv'
  verbose?: boolean
}

export interface CLIConfigOptions {
  set?: {
    key: string
    value: string
  }
  get?: string
  list?: boolean
  reset?: boolean
}

// Core calculation engine types
export interface CalculationParams {
  tokenCount: number
  model: AIModel
  hardware: HardwareConfig
  dataCenter: DataCenterRegion
  contextWindow: number,
  customPue?: number
  customCarbonIntensity?: number
}

export interface CalculationEngine {
  calculateEmissions(params: CalculationParams): CalculationResult
  validateParams(params: CalculationParams): FormValidationResult
}
