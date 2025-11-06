import type { TokenCalculatorFormData } from '@susai/types'

// Project preset interface (simplified version for API use)
export interface ProjectPreset {
  id: string
  name: string
  description: string
  configuration: TokenCalculatorFormData
}

// Default project presets
export const projectPresets: ProjectPreset[] = [
  {
    id: 'gpt-4-research',
    name: 'GPT-4 Token Research',
    description: 'Based on Anu\'s Substack article "We can use tokens to track AI\'s carbon"',
    configuration: {
      tokenCount: 200,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenterProvider: 'aws',
      dataCenterRegion: 'aws-asia-pacific-tokyo',
      customPue: 1.1,
      customCarbonIntensity: undefined,
    },
  },
  {
    id: 'cursor-ai',
    name: 'Cursor.ai',
    description: 'Based on Cursor\'s actual infrastructure as reported in The Pragmatic Engineer',
    configuration: {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-h100',
      dataCenterProvider: 'azure',
      dataCenterRegion: 'azure-virginia',
      customPue: undefined,
      customCarbonIntensity: undefined,
    },
  },
]

export const getPresetById = (id: string): ProjectPreset | undefined => {
  return projectPresets.find(preset => preset.id === id)
}

