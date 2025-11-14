import type { ModelPricing, AIModel } from '@susai/types'
import { isBrowser } from './utils/browser'

/**
 * Fetch model pricing from API (extracts pricing from models with pricing data)
 */
export async function fetchModelPricing(): Promise<Array<{ model: string; input: number; cachedInput: number; output: number }>> {
  if (!isBrowser()) {
    throw new Error('fetchModelPricing can only be called in browser environment')
  }

  const apiUrl = typeof (globalThis as any).process !== 'undefined' 
    ? (globalThis as any).process.env?.NUXT_PUBLIC_API_URL || 'https://localhost:3001'
    : 'https://localhost:3001'
  
  const response = await fetch(`${apiUrl}/api/models`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { success: boolean; data?: AIModel[] }
  if (data.success && data.data) {
    const models: AIModel[] = data.data
    // Extract pricing from models that have it
    return models
      .filter(model => model.pricing)
      .map(model => ({
        model: model.name,
        input: model.pricing!.input,
        cachedInput: model.pricing!.cachedInput,
        output: model.pricing!.output
      }))
  }
  
  throw new Error('Invalid response format from models API')
}

/**
 * Get pricing for a specific model from API
 */
export async function fetchPricingForModel(modelName: string): Promise<ModelPricing | undefined> {
  if (!isBrowser()) {
    throw new Error('fetchPricingForModel can only be called in browser environment')
  }

  const apiUrl = typeof (globalThis as any).process !== 'undefined' 
    ? (globalThis as any).process.env?.NUXT_PUBLIC_API_URL || 'https://localhost:3001'
    : 'https://localhost:3001'
  
  const response = await fetch(`${apiUrl}/api/models`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { success: boolean; data?: AIModel[] }
  if (data.success && data.data) {
    const models: AIModel[] = data.data
    const model = models.find(m => m.name === modelName || m.id === modelName)
    return model?.pricing
  }
  
  throw new Error('Invalid response format from models API')
}


