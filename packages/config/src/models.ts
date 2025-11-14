import type { AIModel } from '@susai/types'
import { isBrowser } from './utils/browser'

/**
 * Get model by ID - DEPRECATED: Use fetchAIModelById instead
 * This function throws an error as hardcoded models have been removed
 */
export function getAIModelById(id: string): AIModel | undefined {
  throw new Error('getAIModelById is deprecated. Models must be fetched from the API. Use fetchAIModelById in browser environments or query the database directly in server environments.')
}

// Fetch models from API (client-side only)
export async function fetchAIModels(): Promise<AIModel[]> {
  if (!isBrowser()) {
    throw new Error('fetchAIModels can only be called in browser environment')
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
    return data.data
  }
  
  throw new Error('Invalid response format from models API')
}

// Fetch model by ID from API (client-side only)
export async function fetchAIModelById(id: string): Promise<AIModel | undefined> {
  if (!isBrowser()) {
    throw new Error('fetchAIModelById can only be called in browser environment')
  }

  const apiUrl = typeof (globalThis as any).process !== 'undefined' 
    ? (globalThis as any).process.env?.NUXT_PUBLIC_API_URL || 'https://localhost:3001'
    : 'https://localhost:3001'
  
  const response = await fetch(`${apiUrl}/api/models/${id}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      return undefined
    }
    throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as { success: boolean; data?: AIModel }
  if (data.success && data.data) {
    return data.data
  }
  
  throw new Error('Invalid response format from models API')
}

