import type { 
  TokenCalculatorFormData, 
  CalculationResult,
  AIModel,
  HardwareConfig,
  DataCenterRegion
} from '@susai/types'
import { 
  aiModels, 
  hardwareConfigs, 
  dataCenterProviders,
  getRegionsForProvider,
  getPueForRegion,
  getCarbonIntensityForRegion
} from '@susai/config'
import { sustainableAICalculator } from '@susai/core'

export const useTokenCalculator = () => {

  // Calculate energy and emissions using the core engine
  const calculateEmissions = (formData: TokenCalculatorFormData): CalculationResult => {
    return sustainableAICalculator.calculateFromFormData(formData)
  }

  // Validate form data using the core engine
  const validateFormData = (formData: TokenCalculatorFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validate token count
    if (formData.tokenCount < 1 || formData.tokenCount > 5000000000) {
      errors.push('Token count must be between 1 and 5,000,000,000')
    }

    // Validate context length
    if (formData.contextLength < 1000 || formData.contextLength > 32000) {
      errors.push('Context length must be between 1,000 and 32,000 tokens')
    }

    // Validate context window
    if (formData.contextWindow < 100 || formData.contextWindow > 2000) {
      errors.push('Context window must be between 100 and 2,000 tokens')
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
    aiModels,
    hardwareConfigs,
    dataCenterProviders,
    calculateEmissions,
    validateFormData,
    formatNumber,
    formatLargeNumber,
    getRegionsForProvider,
    getPueForRegion,
    getCarbonIntensityForRegion
  }
}
