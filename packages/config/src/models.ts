import type { AIModel } from '@susai/types'

// Default token weights based on FLOP/token research
// Used for models that support cache differentiation
const defaultTokenWeights = {
  inputWithCache: 1.25,
  inputWithoutCache: 1.00,
  cacheRead: 0.10,
  outputTokens: 5.00
}

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
  },
  {
    id: 'sonnet-4.5',
    name: 'Sonnet 4.5',
    parameters: 100,
    contextLength: 200000,
    contextWindow: 1500,
    complexityFactor: 0.57, // Similar to Claude 3 Sonnet
    tokenWeights: defaultTokenWeights
  },
  {
    id: 'composer-1',
    name: 'Composer 1',
    parameters: 100,
    contextLength: 200000,
    contextWindow: 1500,
    complexityFactor: 0.57, // Similar to Claude 3 Sonnet
    tokenWeights: defaultTokenWeights
  }
]

export const getAIModelById = (id: string): AIModel | undefined => {
  return aiModels.find(model => model.id === id)
}

