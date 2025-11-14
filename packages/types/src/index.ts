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
export interface TokenWeights {
  inputWithCache: number // multiplier for input tokens with cache write
  inputWithoutCache: number // multiplier for input tokens without cache write
  cacheRead: number // multiplier for cache-read tokens
  outputTokens: number // multiplier for output tokens
}

export interface ModelPricing {
  input: number // Price per 1M input tokens
  cachedInput: number // Price per 1M cached input tokens
  output: number // Price per 1M output tokens
}

export interface AIModel {
  id: string
  name: string
  parameters: number // in billions
  contextLength: number
  contextWindow: number
  complexityFactor: number // relative to GPT-3 (1.0 = GPT-3 baseline)
  tokenWeights?: TokenWeights // optional token weights for weighted token calculation
  pricing?: ModelPricing // optional pricing information
  isSystem?: boolean // whether this is a system model that cannot be deleted
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
  weightedTokens?: number // Weighted token count when detailed breakdown is used
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
  // Detailed token breakdown (optional, for weighted calculation)
  useDetailedTokens?: boolean
  inputWithCache?: number
  inputWithoutCache?: number
  cacheRead?: number
  outputTokens?: number
  tokenWeights?: TokenWeights // optional override for model token weights
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
  // Detailed token breakdown (optional, for weighted calculation)
  inputWithCache?: number
  inputWithoutCache?: number
  cacheRead?: number
  outputTokens?: number
  tokenWeights?: TokenWeights // optional override for model token weights
}

export interface CalculationEngine {
  calculateEmissions(params: CalculationParams): CalculationResult
  validateParams(params: CalculationParams): FormValidationResult
}

// Token Simulator Types
export interface Chat {
  id: string
  name: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface Agent {
  id: string
  chat_id: string
  name: string
  created_at: string
  display_order: number
}

export interface Round {
  id: string
  chat_id: string
  round_number: number
  prompt: string
  prompt_tokens: number
  actual_input_tokens?: number
  created_at: string
  updated_at: string
}

export interface AgentResponse {
  id: string
  round_id: string
  agent_id: string
  response_text: string
  token_count: number
  created_at: string
  updated_at: string
}

export interface RoundWithResponses extends Round {
  responses: (AgentResponse & { agent: Agent })[]
}

export interface ChatWithDetails extends Chat {
  agents: Agent[]
  rounds: RoundWithResponses[]
  summary?: ChatSummary
}

export interface ChatSummary {
  chat_id: string
  total_input_tokens: number
  total_output_tokens: number
  total_tokens: number
  gpt35_input_cost?: number
  gpt35_output_cost?: number
  gpt35_total_cost?: number
  gpt4o_input_cost: number
  gpt4o_output_cost: number
  gpt4o_total_cost: number
  gpt41_input_cost?: number
  gpt41_output_cost?: number
  gpt41_total_cost?: number
  gpt5_input_cost?: number
  gpt5_output_cost?: number
  gpt5_total_cost?: number
  updated_at: string
}

export interface TokenCountResult {
  count: number
  model: string
}

export interface CostCalculationResult {
  inputCost: number
  outputCost: number
  totalCost: number
  model: string
}

export interface CreateChatRequest {
  name?: string
  user_id: string
}

export interface UpdateChatRequest {
  name?: string
}

export interface CreateAgentRequest {
  name?: string
  chat_id: string
}

export interface UpdateAgentRequest {
  name?: string
  display_order?: number
}

export interface CreateRoundRequest {
  chat_id: string
  prompt: string
  responses: {
    agent_id: string
    response_text: string
  }[]
}

export interface UpdateRoundRequest {
  prompt?: string
  responses?: {
    agent_id: string
    response_text: string
  }[]
}

// Model Management API Types
export interface CreateModelRequest {
  name: string
  parameters: number
  contextLength: number
  contextWindow: number
  tokenWeights?: TokenWeights
  pricing?: ModelPricing
}

export interface UpdateModelRequest {
  name?: string
  parameters?: number
  contextLength?: number
  contextWindow?: number
  tokenWeights?: TokenWeights | null
  pricing?: ModelPricing | null
}

export interface ModelResponse extends AIModel {
  createdAt?: string
  updatedAt?: string
}
