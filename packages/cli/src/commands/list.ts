import { Command } from 'commander'
import chalk from 'chalk'
import { aiModels, hardwareConfigs, dataCenterProviders } from '@susai/config'

export const listCommand = new Command('list')
  .description('List available models, hardware, and data centers')
  .option('-m, --models', 'List available AI models')
  .option('-h, --hardware', 'List available hardware configurations')
  .option('-d, --datacenters', 'List available data center providers')
  .option('-r, --regions <provider>', 'List regions for a specific provider')
  .option('-a, --all', 'List everything')
  .action(async (options) => {
    if (options.models || options.all) {
      console.log(chalk.blue('🤖 Available AI Models:'))
      aiModels.forEach(model => {
        console.log(`  ${chalk.cyan(model.id)} - ${model.name} (${model.parameters}B params)`)
      })
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
