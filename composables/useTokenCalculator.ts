import type { 
  AIModel, 
  HardwareConfig, 
  DataCenterConfig, 
  TokenCalculatorFormData, 
  CalculationResult 
} from '~/types/watttime'

export const useTokenCalculator = () => {
  // Predefined AI models
  const aiModels: AIModel[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      parameters: 280,
      contextLength: 8000,
      contextWindow: 1250,
      energyPerToken: 673.2,
      carbonPerToken: 0.0859
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      parameters: 175,
      contextLength: 4000,
      contextWindow: 1000,
      energyPerToken: 400.0,
      carbonPerToken: 0.051
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      parameters: 200,
      contextLength: 200000,
      contextWindow: 2000,
      energyPerToken: 500.0,
      carbonPerToken: 0.064
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      parameters: 100,
      contextLength: 200000,
      contextWindow: 1500,
      energyPerToken: 300.0,
      carbonPerToken: 0.038
    },
    {
      id: 'llama-2-70b',
      name: 'Llama 2 70B',
      parameters: 70,
      contextLength: 4096,
      contextWindow: 1000,
      energyPerToken: 250.0,
      carbonPerToken: 0.032
    }
  ]

  // Hardware configurations
  const hardwareConfigs: HardwareConfig[] = [
    {
      id: 'nvidia-a100',
      name: 'NVIDIA A100',
      powerConsumption: 400,
      tokensPerSecond: 1400,
      efficiency: 3.5
    },
    {
      id: 'nvidia-v100',
      name: 'NVIDIA V100',
      powerConsumption: 300,
      tokensPerSecond: 800,
      efficiency: 2.67
    },
    {
      id: 'nvidia-h100',
      name: 'NVIDIA H100',
      powerConsumption: 700,
      tokensPerSecond: 2000,
      efficiency: 2.86
    },
    {
      id: 'tpu-v4',
      name: 'Google TPU v4',
      powerConsumption: 200,
      tokensPerSecond: 1000,
      efficiency: 5.0
    }
  ]

  // Data center configurations
  const dataCenterConfigs: DataCenterConfig[] = [
    {
      id: 'google-korea',
      name: 'Google Cloud Korea',
      region: 'Asia Pacific',
      pue: 1.1,
      carbonIntensity: 0.459
    },
    {
      id: 'aws-us-east',
      name: 'AWS US East',
      region: 'North America',
      pue: 1.2,
      carbonIntensity: 0.415
    },
    {
      id: 'aws-eu-west',
      name: 'AWS EU West',
      region: 'Europe',
      pue: 1.15,
      carbonIntensity: 0.285
    },
    {
      id: 'azure-norway',
      name: 'Azure Norway',
      region: 'Europe',
      pue: 1.05,
      carbonIntensity: 0.012
    },
    {
      id: 'google-oregon',
      name: 'Google Cloud Oregon',
      region: 'North America',
      pue: 1.1,
      carbonIntensity: 0.200
    }
  ]

  // Calculate energy and emissions
  const calculateEmissions = (formData: TokenCalculatorFormData): CalculationResult => {
    const model = aiModels.find(m => m.id === formData.model) || aiModels[0]
    const hardware = hardwareConfigs.find(h => h.id === formData.hardware) || hardwareConfigs[0]
    const dataCenter = dataCenterConfigs.find(d => d.id === formData.dataCenter) || dataCenterConfigs[0]

    // Use custom values if provided, otherwise use data center defaults
    const pue = formData.customPue ?? dataCenter!.pue
    const carbonIntensity = formData.customCarbonIntensity ?? dataCenter!.carbonIntensity

    // Calculate energy per token based on model complexity and hardware efficiency
    const baseEnergyPerToken = model!.energyPerToken
    const hardwareEfficiency = hardware!.efficiency
    const contextFactor = Math.sqrt(formData.contextLength / model!.contextLength)
    const windowFactor = Math.sqrt(formData.contextWindow / model!.contextWindow)
    
    // Apply context and window adjustments, then PUE adjustment
    const adjustedEnergyPerToken = baseEnergyPerToken * contextFactor * windowFactor * pue
    
    // Calculate total energy
    const energyJoules = adjustedEnergyPerToken * formData.tokenCount
    const energyKWh = energyJoules / 3600000 // Convert joules to kWh
    
    // Calculate carbon emissions per token
    const carbonEmissionsPerTokenGrams = (adjustedEnergyPerToken / 3600000) * carbonIntensity * 1000 // Convert to grams
    const totalEmissionsGrams = carbonEmissionsPerTokenGrams * formData.tokenCount
    
    // Calculate equivalent metrics
    const equivalentLightbulbMinutes = (energyKWh * formData.tokenCount) / 0.01 // 10W lightbulb
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

  // Validate form data
  const validateFormData = (formData: TokenCalculatorFormData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (formData.tokenCount < 1 || formData.tokenCount > 1000000) {
      errors.push('Token count must be between 1 and 1,000,000')
    }

    if (formData.contextLength < 1000 || formData.contextLength > 32000) {
      errors.push('Context length must be between 1,000 and 32,000 tokens')
    }

    if (formData.contextWindow < 100 || formData.contextWindow > 2000) {
      errors.push('Context window must be between 100 and 2,000 tokens')
    }

    if (formData.customPue && (formData.customPue < 1.0 || formData.customPue > 3.0)) {
      errors.push('PUE must be between 1.0 and 3.0')
    }

    if (formData.customCarbonIntensity && (formData.customCarbonIntensity < 0.0 || formData.customCarbonIntensity > 1.0)) {
      errors.push('Carbon intensity must be between 0.0 and 1.0 kg CO₂/kWh')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Format numbers for display
  const formatNumber = (value: number, decimals: number = 3): string => {
    return value.toFixed(decimals)
  }

  // Format large numbers with units
  const formatLargeNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(1)
  }

  return {
    aiModels,
    hardwareConfigs,
    dataCenterConfigs,
    calculateEmissions,
    validateFormData,
    formatNumber,
    formatLargeNumber
  }
}
