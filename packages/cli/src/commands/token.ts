import { Command } from 'commander'
import chalk from 'chalk'
import { countTokens, calculateCost, type TokenizerModel } from '@susai/core'

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
  .option('-m, --model <model>', 'Model to calculate costs for (gpt-3.5-turbo, gpt-4o)', 'gpt-4o')
  .action((options: { input?: string; output?: string; model?: string }) => {
    try {
      const inputTokens = parseInt(options.input || '0', 10)
      const outputTokens = parseInt(options.output || '0', 10)
      const model = (options.model || 'gpt-4o') as 'gpt-3.5-turbo' | 'gpt-4o'

      if (isNaN(inputTokens) || inputTokens < 0) {
        throw new Error('Input token count must be a non-negative number')
      }

      if (isNaN(outputTokens) || outputTokens < 0) {
        throw new Error('Output token count must be a non-negative number')
      }

      if (model !== 'gpt-3.5-turbo' && model !== 'gpt-4o') {
        throw new Error('Model must be either "gpt-3.5-turbo" or "gpt-4o"')
      }

      const cost = calculateCost(inputTokens, outputTokens, model)

      console.log(chalk.cyan('\nCost Calculation:'))
      console.log(chalk.gray(`Model: ${model}`))
      console.log(chalk.gray(`Input tokens: ${inputTokens.toLocaleString()}`))
      console.log(chalk.gray(`Output tokens: ${outputTokens.toLocaleString()}`))
      console.log(chalk.gray(`Total tokens: ${(inputTokens + outputTokens).toLocaleString()}`))
      console.log(chalk.green(`\nInput cost: $${cost.inputCost.toFixed(6)}`))
      console.log(chalk.green(`Output cost: $${cost.outputCost.toFixed(6)}`))
      console.log(chalk.green(`Total cost: $${cost.totalCost.toFixed(6)}`))

      // Pricing info
      const pricing = {
        'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
        'gpt-4o': { input: 5.00, output: 15.00 }
      }
      const rates = pricing[model]
      console.log(chalk.gray(`\nPricing: $${rates.input}/1M input tokens, $${rates.output}/1M output tokens`))
    } catch (error: any) {
      console.error(chalk.red('Error calculating costs:'), error.message)
      process.exit(1)
    }
  })

