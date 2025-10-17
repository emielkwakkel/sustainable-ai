import type { 
  AIModel, 
  HardwareConfig, 
  DataCenterProvider,
  DataCenterRegion,
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
      complexityFactor: 1.6 // 280B / 175B = 1.6x more complex than GPT-3
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      parameters: 175,
      contextLength: 4000,
      contextWindow: 1000,
      complexityFactor: 1.0 // Baseline (GPT-3 equivalent)
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      parameters: 200,
      contextLength: 200000,
      contextWindow: 2000,
      complexityFactor: 1.14 // 200B / 175B = 1.14x more complex than GPT-3
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      parameters: 100,
      contextLength: 200000,
      contextWindow: 1500,
      complexityFactor: 0.57 // 100B / 175B = 0.57x less complex than GPT-3
    },
    {
      id: 'llama-2-70b',
      name: 'Llama 2 70B',
      parameters: 70,
      contextLength: 4096,
      contextWindow: 1000,
      complexityFactor: 0.4 // 70B / 175B = 0.4x less complex than GPT-3
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

  // Data center providers and regions
  const dataCenterProviders: DataCenterProvider[] = [
    {
      id: 'google-cloud',
      name: 'Google Cloud',
      regions: [
        { id: 'google-berkeley', name: 'Berkeley County, South Carolina', region: 'US-SC', pue: 1.07, carbonIntensity: 0.415 },
        { id: 'google-ohio-columbus', name: 'Central Ohio (Columbus)', region: 'US-OH', pue: 1.05, carbonIntensity: 0.415 },
        { id: 'google-ohio-lancaster', name: 'Central Ohio (Lancaster)', region: 'US-OH', pue: 1.04, carbonIntensity: 0.415 },
        { id: 'google-ohio-new-albany', name: 'Central Ohio (New Albany)', region: 'US-OH', pue: 1.05, carbonIntensity: 0.415 },
        { id: 'google-taiwan', name: 'Changua County, Taiwan', region: 'TW', pue: 1.1, carbonIntensity: 0.459 },
        { id: 'google-iowa', name: 'Council Bluffs, Iowa', region: 'US-IA', pue: 1.1, carbonIntensity: 0.415 },
        { id: 'google-iowa-2', name: 'Council Bluffs, Iowa (2nd facility)', region: 'US-IA', pue: 1.07, carbonIntensity: 0.415 },
        { id: 'google-georgia', name: 'Douglas County, Georgia', region: 'US-GA', pue: 1.08, carbonIntensity: 0.415 },
        { id: 'google-ireland', name: 'Dublin, Ireland', region: 'IE', pue: 1.08, carbonIntensity: 0.285 },
        { id: 'google-netherlands', name: 'Eemshaven, Netherlands', region: 'NL', pue: 1.07, carbonIntensity: 0.285 },
        { id: 'google-denmark', name: 'Fredericia, Denmark', region: 'DK', pue: 1.07, carbonIntensity: 0.285 },
        { id: 'google-finland', name: 'Hamina, Finland', region: 'FI', pue: 1.09, carbonIntensity: 0.285 },
        { id: 'google-nevada', name: 'Henderson, Nevada', region: 'US-NV', pue: 1.07, carbonIntensity: 0.415 },
        { id: 'google-japan', name: 'Inzai, Japan', region: 'JP', pue: 1.12, carbonIntensity: 0.459 },
        { id: 'google-alabama', name: 'Jackson County, Alabama', region: 'US-AL', pue: 1.09, carbonIntensity: 0.415 },
        { id: 'google-north-carolina', name: 'Lenoir, North Carolina', region: 'US-NC', pue: 1.08, carbonIntensity: 0.415 },
        { id: 'google-virginia', name: 'Loudoun County, Virginia', region: 'US-VA', pue: 1.07, carbonIntensity: 0.415 },
        { id: 'google-virginia-2', name: 'Loudoun County, Virginia (2nd facility)', region: 'US-VA', pue: 1.07, carbonIntensity: 0.415 },
        { id: 'google-oklahoma', name: 'Mayes County, Oklahoma', region: 'US-OK', pue: 1.09, carbonIntensity: 0.415 },
        { id: 'google-texas', name: 'Midlothian, Texas', region: 'US-TX', pue: 1.08, carbonIntensity: 0.415 },
        { id: 'google-tennessee', name: 'Montgomery County, Tennessee', region: 'US-TN', pue: 1.08, carbonIntensity: 0.415 },
        { id: 'google-nebraska', name: 'Papillion, Nebraska', region: 'US-NE', pue: 1.08, carbonIntensity: 0.415 },
        { id: 'google-chile', name: 'Quilicura, Chile', region: 'CL', pue: 1.09, carbonIntensity: 0.200 },
        { id: 'google-singapore', name: 'Singapore', region: 'SG', pue: 1.12, carbonIntensity: 0.459 },
        { id: 'google-singapore-2', name: 'Singapore (2nd facility)', region: 'SG', pue: 1.14, carbonIntensity: 0.459 },
        { id: 'google-belgium', name: 'St. Ghislain, Belgium', region: 'BE', pue: 1.07, carbonIntensity: 0.285 },
        { id: 'google-nevada-storey', name: 'Storey County, Nevada', region: 'US-NV', pue: 1.09, carbonIntensity: 0.415 },
        { id: 'google-oregon', name: 'The Dalles, Oregon', region: 'US-OR', pue: 1.1, carbonIntensity: 0.200 },
        { id: 'google-oregon-2', name: 'The Dalles, Oregon (2nd facility)', region: 'US-OR', pue: 1.06, carbonIntensity: 0.200 }
      ]
    },
    {
      id: 'aws',
      name: 'Amazon Web Services',
      regions: [
        { id: 'aws-us-east', name: 'US East (N. Virginia)', region: 'US-VA', pue: 1.15, carbonIntensity: 0.415 },
        { id: 'aws-us-west', name: 'US West (Oregon)', region: 'US-OR', pue: 1.15, carbonIntensity: 0.200 },
        { id: 'aws-eu-west', name: 'Europe (Ireland)', region: 'IE', pue: 1.15, carbonIntensity: 0.285 },
        { id: 'aws-eu-central', name: 'Europe (Frankfurt)', region: 'DE', pue: 1.15, carbonIntensity: 0.285 },
        { id: 'aws-asia-pacific', name: 'Asia Pacific (Singapore)', region: 'SG', pue: 1.15, carbonIntensity: 0.459 },
        { id: 'aws-asia-pacific-tokyo', name: 'Asia Pacific (Tokyo)', region: 'JP', pue: 1.15, carbonIntensity: 0.459 }
      ]
    },
    {
      id: 'azure',
      name: 'Microsoft Azure',
      regions: [
        { id: 'azure-arizona', name: 'Arizona', region: 'US-AZ', pue: 1.13, carbonIntensity: 0.415 },
        { id: 'azure-illinois', name: 'Illinois', region: 'US-IL', pue: 1.25, carbonIntensity: 0.415 },
        { id: 'azure-iowa', name: 'Iowa', region: 'US-IA', pue: 1.16, carbonIntensity: 0.415 },
        { id: 'azure-texas', name: 'Texas', region: 'US-TX', pue: 1.28, carbonIntensity: 0.415 },
        { id: 'azure-virginia', name: 'Virginia', region: 'US-VA', pue: 1.14, carbonIntensity: 0.415 },
        { id: 'azure-washington', name: 'Washington', region: 'US-WA', pue: 1.16, carbonIntensity: 0.200 },
        { id: 'azure-wyoming', name: 'Wyoming', region: 'US-WY', pue: 1.12, carbonIntensity: 0.415 },
        { id: 'azure-singapore', name: 'Singapore', region: 'SG', pue: 1.3, carbonIntensity: 0.459 },
        { id: 'azure-ireland', name: 'Ireland', region: 'IE', pue: 1.18, carbonIntensity: 0.285 },
        { id: 'azure-netherlands', name: 'Netherlands', region: 'NL', pue: 1.14, carbonIntensity: 0.285 },
        { id: 'azure-sweden', name: 'Sweden', region: 'SE', pue: 1.16, carbonIntensity: 0.285 },
        { id: 'azure-poland', name: 'Poland', region: 'PL', pue: 1.19, carbonIntensity: 0.285 }
      ]
    }
  ]

  // Calculate energy and emissions
  const calculateEmissions = (formData: TokenCalculatorFormData): CalculationResult => {
    const model = aiModels.find(m => m.id === formData.model) || aiModels[0]
    const hardware = hardwareConfigs.find(h => h.id === formData.hardware) || hardwareConfigs[0]
    
    // Find the selected data center region
    const provider = dataCenterProviders.find(p => p.id === formData.dataCenterProvider)
    const dataCenterRegion = provider?.regions.find(r => r.id === formData.dataCenterRegion)

    // Use custom values if provided, otherwise use data center defaults
    const pue = formData.customPue ?? dataCenterRegion?.pue ?? 1.2
    const carbonIntensity = formData.customCarbonIntensity ?? dataCenterRegion?.carbonIntensity ?? 0.415

    // Calculate base energy per token from GPU power consumption and throughput
    // Formula: Energy per token = GPU Power (kW) / Tokens per second
    const gpuPowerKw = hardware!.powerConsumption / 1000 // Convert watts to kW
    const baseEnergyPerTokenKwh = gpuPowerKw / hardware!.tokensPerSecond // kWh per token
    
    // Scale by model complexity factor first (as per research paper)
    const complexityAdjustedEnergyKwh = baseEnergyPerTokenKwh * model!.complexityFactor
    
    // Apply context window adjustment
    // For GPT-4 with 1250 token window, use the research paper factor of 0.372
    // For other models, use square root scaling
    const contextWindowFactor = (model!.id === 'gpt-4' && formData.contextWindow === 1250) ? 0.372 : Math.sqrt(formData.contextWindow / model!.contextWindow)
    const contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh * contextWindowFactor
    
    // Apply PUE adjustment
    const adjustedEnergyPerTokenKwh = contextAdjustedEnergyKwh * pue
    const adjustedEnergyPerToken = adjustedEnergyPerTokenKwh * 3600000 // Convert kWh to joules
    
    // Calculate total energy
    const energyJoules = adjustedEnergyPerToken * formData.tokenCount
    const energyKWh = energyJoules / 3600000 // Convert joules to kWh
    
    // Calculate carbon emissions per token
    // Convert energy from joules to kWh, then multiply by carbon intensity to get kg CO₂, then convert to grams
    const energyPerTokenKWh = adjustedEnergyPerToken / 3600000 // Convert joules to kWh
    const carbonEmissionsPerTokenKg = energyPerTokenKWh * carbonIntensity // kg CO₂ per token
    const carbonEmissionsPerTokenGrams = carbonEmissionsPerTokenKg * 1000 // Convert kg to grams
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

  // Get available regions for a data center provider
  const getRegionsForProvider = (providerId: string): DataCenterRegion[] => {
    const provider = dataCenterProviders.find(p => p.id === providerId)
    return provider?.regions || []
  }

  // Get PUE for a specific region
  const getPueForRegion = (providerId: string, regionId: string): number | null => {
    const provider = dataCenterProviders.find(p => p.id === providerId)
    const region = provider?.regions.find(r => r.id === regionId)
    return region?.pue || null
  }

  // Get carbon intensity for a specific region
  const getCarbonIntensityForRegion = (providerId: string, regionId: string): number | null => {
    const provider = dataCenterProviders.find(p => p.id === providerId)
    const region = provider?.regions.find(r => r.id === regionId)
    return region?.carbonIntensity || null
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
