import { Command } from 'commander'
import chalk from 'chalk'
import { countTokens, calculateCost, type TokenizerModel } from '@susai/core'
import type { ModelPricing } from '@susai/types'

export const tokenCommand = new Command('token')
  .description('Count tokens in text using js-tiktoken')
  .argument('<text>', 'Text to count tokens for')
  .option('-m, --model <model>', 'Model to use for tokenization (gpt-4, gpt-4o, gpt-3.5-turbo, gpt-3.5-turbo-0125)', 'gpt-4')
  .action((text: string, options: { model?: string }) => {
    try {
      const model = (options.model || 'gpt-4') as TokenizerModel
      const count = countTokens(text, model)

      console.log(chalk.green(`Token count: ${count}`))
      console.log(chalk.gray(`Model: ${model}`))
      console.log(chalk.gray(`Text length: ${text.length} characters`))
    } catch (error: any) {
      console.error(chalk.red('Error counting tokens:'), error.message)
      process.exit(1)
    }
  })

export const costCommand = new Command('cost')
  .description('Calculate costs for token counts based on model pricing')
  .option('-i, --input <number>', 'Input token count', '0')
  .option('-o, --output <number>', 'Output token count', '0')
  .option('-m, --model <model>', 'Model name or ID to calculate costs for', 'gpt-4o')
  .option('--api-url <url>', 'API URL to fetch model pricing from', 'https://localhost:3001')
  .action(async (options: { input?: string; output?: string; model?: string; apiUrl?: string }) => {
    try {
      const inputTokens = parseInt(options.input || '0', 10)
      const outputTokens = parseInt(options.output || '0', 10)
      const modelId = options.model || 'gpt-4o'
      const apiUrl = options.apiUrl || 'https://localhost:3001'

      if (isNaN(inputTokens) || inputTokens < 0) {
        throw new Error('Input token count must be a non-negative number')
      }

      if (isNaN(outputTokens) || outputTokens < 0) {
        throw new Error('Output token count must be a non-negative number')
      }

      // Fetch model pricing from API
      let pricing: ModelPricing
      try {
        const response = await fetch(`${apiUrl}/api/models/${modelId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        if (!data.success || !data.data || !data.data.pricing) {
          throw new Error(`Model '${modelId}' not found or has no pricing information`)
        }
        pricing = data.data.pricing
      } catch (error: any) {
        console.error(chalk.red('Error fetching model pricing:'), error.message)
        console.error(chalk.yellow('Make sure the API server is running and the model exists in the database.'))
        process.exit(1)
      }

      const cost = calculateCost(inputTokens, outputTokens, pricing, false, modelId)

      console.log(chalk.cyan('\nCost Calculation:'))
      console.log(chalk.gray(`Model: ${modelId}`))
      console.log(chalk.gray(`Input tokens: ${inputTokens.toLocaleString()}`))
      console.log(chalk.gray(`Output tokens: ${outputTokens.toLocaleString()}`))
      console.log(chalk.gray(`Total tokens: ${(inputTokens + outputTokens).toLocaleString()}`))
      console.log(chalk.green(`\nInput cost: $${cost.inputCost.toFixed(6)}`))
      console.log(chalk.green(`Output cost: $${cost.outputCost.toFixed(6)}`))
      console.log(chalk.green(`Total cost: $${cost.totalCost.toFixed(6)}`))
      console.log(chalk.gray(`\nPricing: $${pricing.input}/1M input tokens, $${pricing.output}/1M output tokens`))
      if (pricing.cachedInput !== undefined) {
        console.log(chalk.gray(`Cached input: $${pricing.cachedInput}/1M tokens`))
      }
    } catch (error: any) {
      console.error(chalk.red('Error calculating costs:'), error.message)
      process.exit(1)
    }
  })

