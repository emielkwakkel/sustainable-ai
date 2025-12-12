import type { 
  CalculationParams, 
  CalculationResult, 
  CalculationEngine,
  FormValidationResult,
  TokenCalculatorFormData,
  TokenWeights,
  AIModel
} from '@susai/types'
import { 
  getAIModelById, 
  getHardwareConfigById, 
  getDataCenterRegionById 
} from '@susai/config'

export class SustainableAICalculator implements CalculationEngine {
  /**
   * Calculate weighted tokens from detailed token breakdown
   * Formula: weighted_tokens = 1.25 * inputWithCache + 1.00 * inputWithoutCache + 0.10 * cacheRead + 5.00 * outputTokens
   */
  calculateWeightedTokens(
    inputWithCache: number,
    inputWithoutCache: number,
    cacheRead: number,
    outputTokens: number,
    tokenWeights?: TokenWeights
  ): number {
    // Use provided weights or default weights
    const weights = tokenWeights || {
      inputWithCache: 1.25,
      inputWithoutCache: 1.00,
      cacheRead: 0.10,
      outputTokens: 5.00
    }

    return (
      weights.inputWithCache * (inputWithCache || 0) +
      weights.inputWithoutCache * (inputWithoutCache || 0) +
      weights.cacheRead * (cacheRead || 0) +
      weights.outputTokens * (outputTokens || 0)
    )
  }

  /**
   * Calculate energy consumption and carbon emissions for AI model token usage
   */
  calculateEmissions(params: CalculationParams): CalculationResult {
    const { 
      tokenCount, 
      model, 
      hardware, 
      dataCenter, 
      customPue, 
      customCarbonIntensity,
      inputWithCache,
      inputWithoutCache,
      cacheRead,
      outputTokens,
      tokenWeights
    } = params

    // Calculate effective token count
    // If detailed token breakdown is provided, use weighted tokens
    // Otherwise, use the provided tokenCount
    let effectiveTokenCount = tokenCount
    
    // Check if we should use detailed token breakdown
    // Either useDetailedTokens flag is set, or at least one detailed field is provided
    const shouldUseDetailedTokens = (
      (params as any).useDetailedTokens === true ||
      inputWithCache !== undefined ||
      inputWithoutCache !== undefined ||
      cacheRead !== undefined ||
      outputTokens !== undefined
    )
    
    if (shouldUseDetailedTokens) {
      // Use model's token weights if available, otherwise use provided override or defaults
      const weights = tokenWeights || model.tokenWeights
      effectiveTokenCount = this.calculateWeightedTokens(
        inputWithCache || 0,
        inputWithoutCache || 0,
        cacheRead || 0,
        outputTokens || 0,
        weights
      )
    }

    // Use custom values if provided, otherwise use data center defaults
    const pue = customPue ?? dataCenter.pue
    const carbonIntensity = customCarbonIntensity ?? dataCenter.carbonIntensity

    // Calculate base energy per token from GPU power consumption and throughput
    // Formula: Energy per token = GPU Power (kW) / Tokens per second
    const gpuPowerKw = hardware.powerConsumption / 1000 // Convert watts to kW
    const baseEnergyPerTokenKwh = gpuPowerKw / hardware.tokensPerSecond // kWh per token
    
    // Scale by model complexity factor first (as per research paper)
    const complexityAdjustedEnergyKwh = baseEnergyPerTokenKwh * model.complexityFactor
    
    // Apply context window adjustment
    // IMPORTANT: When using weighted tokens (detailed token breakdown), we skip context window adjustment
    // because weighted tokens already account for processing complexity and overhead.
    // Applying context window adjustment on top of weighted tokens would double-count overhead,
    // leading to unrealistic energy calculations (e.g., 2.41 t CO₂ for a single prompt).
    //
    // The context window adjustment from the research paper was designed for simple token counts,
    // where the quadratic formula accounts for attention mechanism overhead scaling with context size.
    // With weighted tokens, this overhead is already reflected in the token weights:
    // - Cache reads have minimal weight (0.001) because they don't require attention processing
    // - Input tokens have standard weight (1.0) because they require attention
    // - Output tokens have higher weight (5.0) because generation is more energy-intensive
    //
    // For calculations without detailed tokens, we still apply context window adjustment as per research paper.
    let contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh
    
    if (!shouldUseDetailedTokens) {
      // Apply context window adjustment only when NOT using weighted tokens
      // Formula from research paper: (actual_window / GPT-3_baseline_window)²
      // GPT-3's context window is 2048 tokens (the baseline for energy calculations)
      const GPT3_BASELINE_CONTEXT_WINDOW = 2048
      const contextWindowFactor = Math.pow(params.contextWindow / GPT3_BASELINE_CONTEXT_WINDOW, 2)
      contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh * contextWindowFactor
    }
    
    // Apply PUE adjustment
    const adjustedEnergyPerTokenKwh = contextAdjustedEnergyKwh * pue
    const adjustedEnergyPerToken = adjustedEnergyPerTokenKwh * 3600000 // Convert kWh to joules
    
    // Calculate total energy using effective token count
    const energyJoules = adjustedEnergyPerToken * effectiveTokenCount
    const energyKWh = energyJoules / 3600000 // Convert joules to kWh
    
    // Calculate carbon emissions per token
    // Convert energy from joules to kWh, then multiply by carbon intensity to get kg CO₂, then convert to grams
    const energyPerTokenKWh = adjustedEnergyPerToken / 3600000 // Convert joules to kWh
    const carbonEmissionsPerTokenKg = energyPerTokenKWh * carbonIntensity // kg CO₂ per token
    const carbonEmissionsPerTokenGrams = carbonEmissionsPerTokenKg * 1000 // Convert kg to grams
    const totalEmissionsGrams = carbonEmissionsPerTokenGrams * effectiveTokenCount
    
    // Calculate equivalent metrics using effective token count
    const equivalentLightbulbMinutes = energyKWh / 0.01 // 10W lightbulb (energyKWh is already total energy)
    const equivalentCarMiles = (totalEmissionsGrams / 1000) * 2.3 // kg CO₂ per mile
    const equivalentTreeHours = totalEmissionsGrams / 0.022 // grams CO₂ absorbed per hour by a tree

    const result: CalculationResult = {
      energyJoules,
      energyKWh,
      carbonEmissionsGrams: carbonEmissionsPerTokenGrams,
      totalEmissionsGrams,
      equivalentLightbulbMinutes,
      equivalentCarMiles,
      equivalentTreeHours
    }
    
    // Include weighted tokens in result if detailed breakdown was used
    if (shouldUseDetailedTokens) {
      result.weightedTokens = effectiveTokenCount
    }
    
    return result
  }

  /**
   * Validate calculation parameters
   */
  validateParams(params: CalculationParams): FormValidationResult {
    const errors: string[] = []

    if (params.tokenCount < 1 || params.tokenCount > 1000000) {
      errors.push('Token count must be between 1 and 1,000,000')
    }

    // Check if context length is within supported range
    // Note: This should validate the actual context length being used, not the model's max
    // For now, we'll validate that the context length is reasonable
    // TODO: This validation should be moved to the form validation layer
    // where we can access the form data's context length
    if (params.model.contextLength < 1000 || params.model.contextLength > 500000) {
      errors.push('Context length must be between 1,000 and 500,000 tokens')
    }

    // Validate context window - maximum is the model's context length (maximum capacity)
    const maxContextWindow = params.model.contextLength || 2000 // Use model's context length if available, otherwise default to 2000
    if (params.contextWindow < 100 || params.contextWindow > maxContextWindow) {
      errors.push(`Context window must be between 100 and ${maxContextWindow.toLocaleString()} tokens (model's maximum capacity)`)
    }

    if (params.customPue && (params.customPue < 1.0 || params.customPue > 3.0)) {
      errors.push('PUE must be between 1.0 and 3.0')
    }

    if (params.customCarbonIntensity && (params.customCarbonIntensity < 0.0 || params.customCarbonIntensity > 1.0)) {
      errors.push('Carbon intensity must be between 0.0 and 1.0 kg CO₂/kWh')
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(error => ({ field: 'general', message: error }))
    }
  }

  /**
   * Calculate emissions from form data
   * @param formData - Form data with model ID or model object
   * @param modelOverride - Optional model object. If provided, formData.model is ignored
   */
  calculateFromFormData(formData: TokenCalculatorFormData, modelOverride?: AIModel): CalculationResult {
    // Use provided model or try to get from config (will throw if not available)
    let model: AIModel | undefined = modelOverride
    if (!model) {
      try {
        model = getAIModelById(formData.model)
      } catch (error) {
        throw new Error(`Model '${formData.model}' not found. Models must be fetched from the database or API.`)
      }
    }
    
    const hardware = getHardwareConfigById(formData.hardware)
    const dataCenter = getDataCenterRegionById(formData.dataCenterProvider, formData.dataCenterRegion)

    if (!model || !hardware || !dataCenter) {
      throw new Error('Invalid model, hardware, or data center configuration')
    }

    const params: CalculationParams = {
      tokenCount: formData.tokenCount,
      model,
      hardware,
      dataCenter,
      customPue: formData.customPue,
      customCarbonIntensity: formData.customCarbonIntensity,
      contextWindow: formData.contextWindow,
      // Include detailed token breakdown if provided
      inputWithCache: formData.inputWithCache,
      inputWithoutCache: formData.inputWithoutCache,
      cacheRead: formData.cacheRead,
      outputTokens: formData.outputTokens,
      tokenWeights: formData.tokenWeights
    }

    return this.calculateEmissions(params)
  }

  /**
   * Format numbers for display
   */
  formatNumber(value: number, decimals: number = 3): string {
    return value.toFixed(decimals)
  }

  /**
   * Format large numbers with units
   */
  formatLargeNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(1)
  }
}

// Export a default instance
export const sustainableAICalculator = new SustainableAICalculator()

// Export the class for custom instances (already exported above)

// Export tokenizer functions
export {
  countTokens,
  calculateCost,
  calculateRoundInputTokens,
  calculateChatTokens,
  type TokenizerModel
} from './tokenizer'
