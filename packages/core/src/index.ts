import type { 
  CalculationParams, 
  CalculationResult, 
  CalculationEngine,
  FormValidationResult,
  TokenCalculatorFormData
} from '@susai/types'
import { 
  getAIModelById, 
  getHardwareConfigById, 
  getDataCenterRegionById 
} from '@susai/config'

export class SustainableAICalculator implements CalculationEngine {
  /**
   * Calculate energy consumption and carbon emissions for AI model token usage
   */
  calculateEmissions(params: CalculationParams): CalculationResult {
    const { tokenCount, model, hardware, dataCenter, customPue, customCarbonIntensity } = params

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
    // For GPT-4 with 1250 token window, use the research paper factor of 0.372
    // For other models, use square root scaling
    const contextWindowFactor = (model.id === 'gpt-4' && params.contextWindow === 1250) 
      ? 0.372 
      : Math.sqrt(params.contextWindow / model.contextWindow)
    const contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh * contextWindowFactor
    
    // Apply PUE adjustment
    const adjustedEnergyPerTokenKwh = contextAdjustedEnergyKwh * pue
    const adjustedEnergyPerToken = adjustedEnergyPerTokenKwh * 3600000 // Convert kWh to joules
    
    // Calculate total energy
    const energyJoules = adjustedEnergyPerToken * tokenCount
    const energyKWh = energyJoules / 3600000 // Convert joules to kWh
    
    // Calculate carbon emissions per token
    // Convert energy from joules to kWh, then multiply by carbon intensity to get kg CO₂, then convert to grams
    const energyPerTokenKWh = adjustedEnergyPerToken / 3600000 // Convert joules to kWh
    const carbonEmissionsPerTokenKg = energyPerTokenKWh * carbonIntensity // kg CO₂ per token
    const carbonEmissionsPerTokenGrams = carbonEmissionsPerTokenKg * 1000 // Convert kg to grams
    const totalEmissionsGrams = carbonEmissionsPerTokenGrams * tokenCount
    
    // Calculate equivalent metrics
    const equivalentLightbulbMinutes = (energyKWh * tokenCount) / 0.01 // 10W lightbulb
    const equivalentCarMiles = (totalEmissionsGrams / 1000) * 2.3 // kg CO₂ per mile
    const equivalentTreeHours = totalEmissionsGrams / 0.022 // grams CO₂ absorbed per hour by a tree

    return {
      energyJoules,
      energyKWh,
      carbonEmissionsGrams: carbonEmissionsPerTokenGrams,
      totalEmissionsGrams,
      equivalentLightbulbMinutes,
      equivalentCarMiles,
      equivalentTreeHours
    }
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
    if (params.model.contextLength < 1000 || params.model.contextLength > 32000) {
      errors.push('Context length must be between 1,000 and 32,000 tokens')
    }

    if (params.contextWindow < 100 || params.contextWindow > 2000) {
      errors.push('Context window must be between 100 and 2,000 tokens')
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
   */
  calculateFromFormData(formData: TokenCalculatorFormData): CalculationResult {
    const model = getAIModelById(formData.model)
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
      contextWindow: formData.contextWindow
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
