import { encodingForModel } from 'js-tiktoken'
import type { CostCalculationResult, Round, AgentResponse, ModelPricing } from '@susai/types'

/**
 * Supported models for tokenization
 */
export type TokenizerModel = 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-3.5-turbo-0125'

/**
 * Count tokens in text using js-tiktoken Lite
 * @param text - Text to count tokens for
 * @param model - Model to use for tokenization (default: 'gpt-4')
 * @returns Number of tokens
 */
export function countTokens(text: string, model: TokenizerModel = 'gpt-4'): number {
  if (!text || text.trim().length === 0) {
    return 0
  }

  try {
    // Map model names to tiktoken model names
    const modelMap: Record<TokenizerModel, string> = {
      'gpt-4': 'gpt-4',
      'gpt-4o': 'gpt-4o',
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125': 'gpt-3.5-turbo'
    }

    const tiktokenModel = modelMap[model] || 'gpt-4'
    const encoding = encodingForModel(tiktokenModel as any)
    const tokens = encoding.encode(text)
    return tokens.length
  } catch (error) {
    console.error('Error counting tokens:', error)
    // Fallback: approximate token count (rough estimate: 1 token ≈ 4 characters)
    return Math.ceil(text.length / 4)
  }
}

/**
 * Calculate cost for token usage based on model pricing
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param pricing - Model pricing information
 * @param useCachedInput - Whether to use cached input pricing (default: false)
 * @param modelName - Optional model name to include in result (default: 'custom')
 * @returns Cost calculation result
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: ModelPricing,
  useCachedInput: boolean = false,
  modelName: string = 'custom'
): CostCalculationResult {
  const inputRate = useCachedInput ? (pricing.cachedInput ?? pricing.input) : pricing.input
  const inputCost = (inputTokens / 1_000_000) * inputRate
  const outputCost = (outputTokens / 1_000_000) * pricing.output

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    model: modelName
  }
}

/**
 * Calculate input tokens for a round in multi-agent conversation
 * For round 1: prompt tokens × number of agents
 * For round 2+: (initial prompt + all previous responses) × number of agents
 * @param roundNumber - Round number (1-based)
 * @param prompt - Current round prompt
 * @param previousRounds - Previous rounds with their prompts and responses
 * @param agentCount - Number of agents in the conversation
 * @param model - Model to use for tokenization
 * @returns Total input tokens for this round
 */
export function calculateRoundInputTokens(
  roundNumber: number,
  prompt: string,
  previousRounds: (Round & { responses: AgentResponse[] })[],
  agentCount: number,
  model: TokenizerModel = 'gpt-4'
): number {
  if (roundNumber === 1) {
    // First round: just the prompt
    return countTokens(prompt, model) * agentCount
  } else {
    // Subsequent rounds: prompt + all previous responses
    let accumulatedText = prompt

    // Add all previous prompts and responses
    for (const round of previousRounds) {
      accumulatedText += '\n\n' + round.prompt
      for (const response of round.responses) {
        accumulatedText += '\n\n' + response.response_text
      }
    }

    return countTokens(accumulatedText, model) * agentCount
  }
}

/**
 * Calculate total tokens for a chat
 * @param rounds - All rounds with their responses
 * @param agentCount - Number of agents
 * @param model - Model to use for tokenization
 * @returns Object with total input, output, and total tokens
 */
export function calculateChatTokens(
  rounds: (Round & { responses: AgentResponse[] })[],
  agentCount: number,
  model: TokenizerModel = 'gpt-4'
): {
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
} {
  let totalInputTokens = 0
  let totalOutputTokens = 0

  // Calculate input tokens for each round
  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i]
    const previousRounds = rounds.slice(0, i)
    const roundInputTokens = calculateRoundInputTokens(
      i + 1,
      round?.prompt || '',
      previousRounds,
      agentCount,
      model
    )
    totalInputTokens += roundInputTokens
  }

  // Calculate output tokens (sum of all responses)
  for (const round of rounds) {
    for (const response of round.responses) {
      totalOutputTokens += response.token_count
    }
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens: totalInputTokens + totalOutputTokens
  }
}

