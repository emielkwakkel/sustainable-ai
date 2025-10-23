import type { 
  AIModel, 
  HardwareConfig, 
  DataCenterProvider,
  DataCenterRegion 
} from '../../types/src/index'

// Predefined AI models
export const aiModels: AIModel[] = [
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
export const hardwareConfigs: HardwareConfig[] = [
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
export const dataCenterProviders: DataCenterProvider[] = [
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

// Utility functions
export const getAIModelById = (id: string): AIModel | undefined => {
  return aiModels.find(model => model.id === id)
}

export const getHardwareConfigById = (id: string): HardwareConfig | undefined => {
  return hardwareConfigs.find(hardware => hardware.id === id)
}

export const getDataCenterProviderById = (id: string): DataCenterProvider | undefined => {
  return dataCenterProviders.find(provider => provider.id === id)
}

export const getDataCenterRegionById = (providerId: string, regionId: string): DataCenterRegion | undefined => {
  const provider = getDataCenterProviderById(providerId)
  return provider?.regions.find((region: DataCenterRegion) => region.id === regionId)
}

export const getRegionsForProvider = (providerId: string): DataCenterRegion[] => {
  const provider = getDataCenterProviderById(providerId)
  return provider?.regions || []
}

export const getPueForRegion = (providerId: string, regionId: string): number | null => {
  const region = getDataCenterRegionById(providerId, regionId)
  return region?.pue || null
}

export const getCarbonIntensityForRegion = (providerId: string, regionId: string): number | null => {
  const region = getDataCenterRegionById(providerId, regionId)
  return region?.carbonIntensity || null
}
