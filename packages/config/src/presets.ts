import type { TokenCalculatorFormData } from '@susai/types'

/**
 * @deprecated This interface is kept for backward compatibility during transition.
 * Presets are now stored in the database. Use the API endpoints instead.
 */
export interface ProjectPreset {
  id: string
  name: string
  description: string
  configuration: TokenCalculatorFormData
}

/**
 * @deprecated Presets are now stored in the database.
 * Use GET /api/presets endpoint instead.
 * This export will be removed in a future version.
 */
export const projectPresets: ProjectPreset[] = []

/**
 * @deprecated Use GET /api/presets/:id endpoint instead.
 * This function will be removed in a future version.
 */
export const getPresetById = (id: string): ProjectPreset | undefined => {
  console.warn('getPresetById is deprecated. Use GET /api/presets/:id endpoint instead.')
  return undefined
}

