import type { TokenCalculatorFormData } from '~/types/watttime'

export interface ProjectPreset {
  id: string
  name: string
  description: string
  configuration: TokenCalculatorFormData
}

export const useProjectPresets = () => {
  const presets: ProjectPreset[] = [
    {
      id: 'gpt-4-token-research',
      name: 'GPT-4 Token Research',
      description: 'Optimized for GPT-4 research and experimentation with standard parameters',
      configuration: {
        tokenCount: 1000,
        model: 'gpt-4',
        contextLength: 8000,
        contextWindow: 1250,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    },
    {
      id: 'cursor-ai',
      name: 'Cursor.ai',
      description: 'Configuration for Cursor AI development environment usage',
      configuration: {
        tokenCount: 1000,
        model: 'gpt-4',
        contextLength: 32000,
        contextWindow: 2000,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    },
    {
      id: 'claude-research',
      name: 'Claude Research',
      description: 'Optimized for Claude 3 research and analysis tasks',
      configuration: {
        tokenCount: 1000,
        model: 'claude-3-opus',
        contextLength: 200000,
        contextWindow: 4000,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    },
    {
      id: 'llama-experiments',
      name: 'Llama Experiments',
      description: 'Configuration for Llama model experimentation and fine-tuning',
      configuration: {
        tokenCount: 1000,
        model: 'llama-2-70b',
        contextLength: 4096,
        contextWindow: 2048,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    },
    {
      id: 'general-ai-usage',
      name: 'General AI Usage',
      description: 'Default configuration for general AI model usage',
      configuration: {
        tokenCount: 1000,
        model: 'gpt-3.5-turbo',
        contextLength: 4000,
        contextWindow: 1000,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    },
    {
      id: 'custom',
      name: 'Custom Configuration',
      description: 'User-defined configuration with custom parameters',
      configuration: {
        tokenCount: 1000,
        model: 'gpt-4',
        contextLength: 8000,
        contextWindow: 1250,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-us-east-1'
      }
    }
  ]

  const getPresetById = (id: string): ProjectPreset | undefined => {
    return presets.find(preset => preset.id === id)
  }

  const getPresetName = (id: string): string => {
    const preset = getPresetById(id)
    return preset?.name || 'Unknown Preset'
  }

  const getPresetDescription = (id: string): string => {
    const preset = getPresetById(id)
    return preset?.description || 'No description available'
  }

  const getPresetConfiguration = (id: string): TokenCalculatorFormData | undefined => {
    const preset = getPresetById(id)
    return preset?.configuration
  }

  const getAllPresets = (): ProjectPreset[] => {
    return presets
  }

  return {
    presets: readonly(presets),
    getPresetById,
    getPresetName,
    getPresetDescription,
    getPresetConfiguration,
    getAllPresets
  }
}
