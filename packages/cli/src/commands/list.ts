import { Command } from 'commander'
import chalk from 'chalk'
import { hardwareConfigs, dataCenterProviders } from '@susai/config'
import type { AIModel } from '@susai/types'

export const listCommand = new Command('list')
  .description('List available models, hardware, and data centers')
  .option('-m, --models', 'List available AI models')
  .option('-h, --hardware', 'List available hardware configurations')
  .option('-d, --datacenters', 'List available data center providers')
  .option('-r, --regions <provider>', 'List regions for a specific provider')
  .option('-a, --all', 'List everything')
  .option('--api-url <url>', 'API URL to fetch models from', 'https://localhost:3001')
  .action(async (options) => {
    if (options.models || options.all) {
      console.log(chalk.blue('🤖 Available AI Models:'))
      try {
        const apiUrl = options.apiUrl || 'https://localhost:3001'
        const response = await fetch(`${apiUrl}/api/models`)
        if (!response.ok) {
          throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
        }
        const data = await response.json()
        if (data.success && data.data) {
          const models: AIModel[] = data.data
          models.forEach(model => {
            console.log(`  ${chalk.cyan(model.id)} - ${model.name} (${model.parameters}B params)`)
          })
        } else {
          throw new Error('Invalid response format from models API')
        }
      } catch (error: any) {
        console.error(chalk.red('Error fetching models:'), error.message)
        console.error(chalk.yellow('Make sure the API server is running.'))
        process.exit(1)
      }
      console.log()
    }

    if (options.hardware || options.all) {
      console.log(chalk.blue('🖥️  Available Hardware:'))
      hardwareConfigs.forEach(hw => {
        console.log(`  ${chalk.cyan(hw.id)} - ${hw.name} (${hw.powerConsumption}W, ${hw.tokensPerSecond} tokens/s)`)
      })
      console.log()
    }

    if (options.datacenters || options.all) {
      console.log(chalk.blue('🏢 Available Data Centers:'))
      dataCenterProviders.forEach(provider => {
        console.log(`  ${chalk.cyan(provider.id)} - ${provider.name} (${provider.regions.length} regions)`)
      })
      console.log()
    }

    if (options.regions) {
      const provider = dataCenterProviders.find(p => p.id === options.regions)
      if (provider) {
        console.log(chalk.blue(`🌍 Regions for ${provider.name}:`))
        provider.regions.forEach(region => {
          console.log(`  ${chalk.cyan(region.id)} - ${region.name} (PUE: ${region.pue}, Carbon: ${region.carbonIntensity} kg CO₂/kWh)`)
        })
      } else {
        console.error(chalk.red(`Provider '${options.regions}' not found`))
      }
    }

    if (!options.models && !options.hardware && !options.datacenters && !options.regions && !options.all) {
      listCommand.help()
    }
  })
