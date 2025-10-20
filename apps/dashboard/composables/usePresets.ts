import type { TokenCalculatorPreset, TokenCalculatorFormData, PresetManager } from '~/types/watttime'

export const usePresets = (): PresetManager => {
  const STORAGE_KEY = 'token-calculator-presets'
  
  // Default presets based on the user story
  const defaultPresets: TokenCalculatorPreset[] = [
    {
      id: 'gpt-4-research',
      name: 'GPT-4 Token Research',
      isDefault: true,
      description: 'Based on Anu\'s Substack article "We can use tokens to track AI\'s carbon"', // https://anuragsridharan.substack.com/p/we-can-use-tokens-to-track-ais-carbon
      configuration: {
        tokenCount: 200,
        model: 'gpt-4',
        contextLength: 8000,
        contextWindow: 1250,
        hardware: 'nvidia-a100',
        dataCenterProvider: 'aws',
        dataCenterRegion: 'aws-asia-pacific-tokyo',
        customPue: 1.1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cursor-ai',
      name: 'Cursor.ai',
      isDefault: true,
      description: 'Based on Cursor\'s actual infrastructure as reported in The Pragmatic Engineer',
      configuration: {
        tokenCount: 1000,
        model: 'gpt-4',
        contextLength: 8000,
        contextWindow: 1250,
        hardware: 'nvidia-h100',
        dataCenterProvider: 'azure',
        dataCenterRegion: 'azure-virginia' // Azure US data center
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Load presets from localStorage
  const loadPresets = (): TokenCalculatorPreset[] => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          return [...defaultPresets, ...parsed]
        }
      } catch (error) {
        console.error('Error loading presets from localStorage:', error)
      }
    }
    return defaultPresets
  }

  // Save presets to localStorage
  const savePresets = (presets: TokenCalculatorPreset[]) => {
    if (typeof window !== 'undefined') {
      try {
        const customPresets = presets.filter(p => !p.isDefault)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets))
      } catch (error) {
        console.error('Error saving presets to localStorage:', error)
      }
    }
  }

  // Generate unique ID
  const generateId = (): string => {
    return `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Reactive state
  const presets = ref<TokenCalculatorPreset[]>(loadPresets())
  const defaultPresetsList = computed(() => presets.value.filter(p => p.isDefault))
  const customPresets = computed(() => presets.value.filter(p => !p.isDefault))

  // Save a new preset
  const savePreset = (name: string, description: string, configuration: TokenCalculatorFormData): string => {
    const id = generateId()
    const now = new Date().toISOString()
    
    const newPreset: TokenCalculatorPreset = {
      id,
      name,
      isDefault: false,
      description,
      configuration,
      createdAt: now,
      updatedAt: now
    }

    presets.value.push(newPreset)
    savePresets(presets.value)
    return id
  }

  // Load a preset configuration
  const loadPreset = (id: string): TokenCalculatorFormData | null => {
    const preset = presets.value.find(p => p.id === id)
    return preset ? preset.configuration : null
  }

  // Delete a preset
  const deletePreset = (id: string): boolean => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset || preset.isDefault) {
      return false // Cannot delete default presets
    }

    const index = presets.value.findIndex(p => p.id === id)
    if (index > -1) {
      presets.value.splice(index, 1)
      savePresets(presets.value)
      return true
    }
    return false
  }

  // Update a preset
  const updatePreset = (id: string, name: string, description: string, configuration: TokenCalculatorFormData): boolean => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset || preset.isDefault) {
      return false // Cannot update default presets
    }

    preset.name = name
    preset.description = description
    preset.configuration = configuration
    preset.updatedAt = new Date().toISOString()

    savePresets(presets.value)
    return true
  }

  // Export presets
  const exportPresets = (): string => {
    const customPresetsToExport = customPresets.value
    return JSON.stringify(customPresetsToExport, null, 2)
  }

  // Import presets
  const importPresets = (data: string): boolean => {
    try {
      const importedPresets = JSON.parse(data) as TokenCalculatorPreset[]
      
      // Validate imported presets
      if (!Array.isArray(importedPresets)) {
        return false
      }

      // Add imported presets with new IDs to avoid conflicts
      const newPresets = importedPresets.map(preset => ({
        ...preset,
        id: generateId(),
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      // Add to existing custom presets
      const existingCustomPresets = customPresets.value
      presets.value = [...defaultPresets, ...existingCustomPresets, ...newPresets]
      savePresets(presets.value)
      
      return true
    } catch (error) {
      console.error('Error importing presets:', error)
      return false
    }
  }

  return {
    presets,
    defaultPresets: defaultPresetsList,
    customPresets,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    exportPresets,
    importPresets
  }
}
