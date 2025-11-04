/**
 * GPT Model Pricing Configuration
 * Prices are per 1,000,000 tokens
 */

export interface ModelPricing {
  model: string
  input: number // Price per 1M input tokens
  cachedInput: number // Price per 1M cached input tokens
  output: number // Price per 1M output tokens
}

export const modelPricing: ModelPricing[] = [
  {
    model: 'gpt-4o',
    input: 2.50,
    cachedInput: 1.25,
    output: 10.00
  },
  {
    model: 'gpt-4.1',
    input: 2.00,
    cachedInput: 0.50,
    output: 8.00
  },
  {
    model: 'gpt-5',
    input: 1.25,
    cachedInput: 0.13,
    output: 10.00
  }
]

/**
 * Get pricing for a specific model
 */
export function getPricingForModel(model: string): ModelPricing | undefined {
  return modelPricing.find(p => p.model === model)
}

/**
 * Calculate cost for input tokens
 */
export function calculateInputCost(tokens: number, model: string, useCached: boolean = false): number {
  const pricing = getPricingForModel(model)
  if (!pricing) return 0
  
  const rate = useCached ? pricing.cachedInput : pricing.input
  return (tokens / 1_000_000) * rate
}

/**
 * Calculate cost for output tokens
 */
export function calculateOutputCost(tokens: number, model: string): number {
  const pricing = getPricingForModel(model)
  if (!pricing) return 0
  
  return (tokens / 1_000_000) * pricing.output
}

