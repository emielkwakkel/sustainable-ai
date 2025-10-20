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
    const pickOrThrow = <T>(value: T | undefined, message: string): T => {
      if (value === undefined || value === null) {
        throw new Error(message)
      }
      return value
    }

    const model: AIModel = pickOrThrow(
      aiModels.find(m => m.id === formData.model) ?? aiModels[0],
      'No AI models configured'
    )

    const hardware: HardwareConfig = pickOrThrow(
      hardwareConfigs.find(h => h.id === formData.hardware) ?? hardwareConfigs[0],
      'No hardware configurations configured'
    )

    const provider = pickOrThrow(
      dataCenterProviders.find(p => p.id === formData.dataCenterProvider) ?? dataCenterProviders[0],
      'No data center providers configured'
    )

    const dataCenter: DataCenterRegion = pickOrThrow(
      provider.regions.find(r => r.id === formData.dataCenterRegion) ?? provider.regions[0],
      'No data center regions configured for selected provider'
    )

    const validation = sustainableAICalculator.validateParams({
      tokenCount: formData.tokenCount,
      model,
      hardware,
      dataCenter,
      customPue: formData.customPue,
      customCarbonIntensity: formData.customCarbonIntensity,
      contextWindow: formData.contextWindow
    })

    return {
      isValid: validation.isValid,
      errors: validation.errors.map(error => error.message)
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
