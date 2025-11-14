import type { 
  TokenCalculatorFormData, 
  CalculationResult,
  AIModel,
  TokenWeights
} from '@susai/types'
import { 
  hardwareConfigs, 
  dataCenterProviders,
  getRegionsForProvider,
  getPueForRegion,
  getCarbonIntensityForRegion,
  fetchAIModels
} from '@susai/config'
import { sustainableAICalculator } from '@susai/core'

export const useTokenCalculator = () => {
  // Models from API (reactive)
  const aiModels = ref<AIModel[]>([])
  const isLoadingModels = ref(false)
  const modelsError = ref<string | null>(null)

  // Fetch models from API on initialization
  onMounted(async () => {
    isLoadingModels.value = true
    modelsError.value = null
    try {
      const models = await fetchAIModels()
      aiModels.value = models
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch models from API'
      console.error('Failed to fetch models from API:', error)
      modelsError.value = errorMessage
      aiModels.value = []
    } finally {
      isLoadingModels.value = false
    }
  })

  // Calculate weighted tokens from detailed token breakdown
  const calculateWeightedTokens = (
    inputWithCache: number,
    inputWithoutCache: number,
    cacheRead: number,
    outputTokens: number,
    modelId?: string,
    tokenWeights?: TokenWeights
  ): number => {
    // Get model-specific weights if model is provided
    let weights = tokenWeights
    if (!weights && modelId) {
      // Use model from reactive list (already fetched from API)
      const model = aiModels.value.find(m => m.id === modelId || m.name === modelId)
      weights = model?.tokenWeights
    }
    
    return sustainableAICalculator.calculateWeightedTokens(
      inputWithCache,
      inputWithoutCache,
      cacheRead,
      outputTokens,
      weights
    )
  }

  // Calculate energy and emissions using the core engine
  const calculateEmissions = (formData: TokenCalculatorFormData): CalculationResult => {
    // Find the model from the reactive list (already fetched from API)
    const model = aiModels.value.find(m => m.id === formData.model || m.name === formData.model)
    
    if (!model) {
      throw new Error(`Model '${formData.model}' not found. Please ensure models are loaded from the API.`)
    }
    
    // Pass the model as override to avoid the core trying to fetch it
    return sustainableAICalculator.calculateFromFormData(formData, model)
  }

  // Validate form data using the core engine
  const validateFormData = (formData: TokenCalculatorFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // If using detailed tokens, validate those fields
    if (formData.useDetailedTokens) {
      if (formData.inputWithCache !== undefined && formData.inputWithCache < 0) {
        errors.push('Input (w/ Cache Write) must be non-negative')
      }
      if (formData.inputWithoutCache !== undefined && formData.inputWithoutCache < 0) {
        errors.push('Input (w/o Cache Write) must be non-negative')
      }
      if (formData.cacheRead !== undefined && formData.cacheRead < 0) {
        errors.push('Cache Read must be non-negative')
      }
      if (formData.outputTokens !== undefined && formData.outputTokens < 0) {
        errors.push('Output Tokens must be non-negative')
      }
      
      // At least one detailed token field should have a value
      const hasAnyDetailedTokens = 
        (formData.inputWithCache ?? 0) > 0 ||
        (formData.inputWithoutCache ?? 0) > 0 ||
        (formData.cacheRead ?? 0) > 0 ||
        (formData.outputTokens ?? 0) > 0
      
      if (!hasAnyDetailedTokens) {
        errors.push('At least one detailed token field must have a value')
      }
    } else {
      // Validate token count for simple mode
      if (formData.tokenCount < 1 || formData.tokenCount > 5000000000) {
        errors.push('Token count must be between 1 and 5,000,000,000')
      }
    }

    // Validate context length
    if (formData.contextLength < 1000 || formData.contextLength > 500000) {
      errors.push('Context length must be between 1,000 and 500,000 tokens')
    }

    // Validate context window
    // Maximum is the model's context length (maximum capacity), minimum is 100
    const maxContextWindow = formData.contextLength || 2000 // Use model's context length if available, otherwise default to 2000
    if (formData.contextWindow < 100 || formData.contextWindow > maxContextWindow) {
      errors.push(`Context window must be between 100 and ${maxContextWindow.toLocaleString()} tokens (model's maximum capacity)`)
    }

    // Validate custom PUE if provided
    if (formData.customPue && (formData.customPue < 1.0 || formData.customPue > 3.0)) {
      errors.push('PUE must be between 1.0 and 3.0')
    }

    // Validate custom carbon intensity if provided
    if (formData.customCarbonIntensity && (formData.customCarbonIntensity < 0.0 || formData.customCarbonIntensity > 1.0)) {
      errors.push('Carbon intensity must be between 0.0 and 1.0 kg CO₂/kWh')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Format numbers for display using the core engine
  const formatNumber = (value: number, decimals: number = 3): string => {
    return sustainableAICalculator.formatNumber(value, decimals)
  }

  // Format large numbers with units using the core engine
  const formatLargeNumber = (value: number): string => {
    return sustainableAICalculator.formatLargeNumber(value)
  }

  return {
    aiModels: computed(() => aiModels.value),
    isLoadingModels: computed(() => isLoadingModels.value),
    modelsError: computed(() => modelsError.value),
    hardwareConfigs,
    dataCenterProviders,
    calculateEmissions,
    calculateWeightedTokens,
    validateFormData,
    formatNumber,
    formatLargeNumber,
    getRegionsForProvider,
    getPueForRegion,
    getCarbonIntensityForRegion
  }
}
