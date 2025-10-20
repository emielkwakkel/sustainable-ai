import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { sustainableAICalculator } from '@susai/core'
import { 
  getAIModelById, 
  getHardwareConfigById, 
  getDataCenterRegionById 
} from '@susai/config'
import type { CLICalculationOptions } from '@susai/types'

export const calculateCommand = new Command('calculate')
  .description('Calculate carbon emissions for AI model token usage')
  .option('-t, --tokens <number>', 'Number of tokens to calculate for', '1000')
  .option('-m, --model <string>', 'AI model to use', 'gpt-4')
  .option('-h, --hardware <string>', 'Hardware configuration', 'nvidia-a100')
  .option('-d, --datacenter <string>', 'Data center provider', 'google-cloud')
  .option('-r, --region <string>', 'Data center region', 'google-taiwan')
  .option('-p, --pue <number>', 'Custom PUE value')
  .option('-c, --carbon-intensity <number>', 'Custom carbon intensity (kg CO₂/kWh)')
  .option('-o, --output <format>', 'Output format (json, table, csv)', 'table')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options: CLICalculationOptions) => {
    const spinner = ora('Calculating emissions...').start()
    
    try {
      // Parse tokens
      const tokenCount = typeof options.tokens === 'string' ? parseInt(options.tokens, 10) : Number(options.tokens)
      if (isNaN(tokenCount) || tokenCount < 1) {
        throw new Error('Invalid token count. Must be a positive number.')
      }

      // Get configurations
      const model = getAIModelById(String(options.model))
      if (!model) {
        throw new Error(`Model '${options.model}' not found`)
      }

      const hardware = getHardwareConfigById(String(options.hardware))
      if (!hardware) {
        throw new Error(`Hardware '${options.hardware}' not found`)
      }

      const dataCenter = getDataCenterRegionById(
        String(options.datacenter), 
        String(options.region)
      )
      if (!dataCenter) {
        throw new Error(`Data center region '${options.region}' not found for provider '${options.datacenter}'`)
      }

      // Calculate emissions
      const result = sustainableAICalculator.calculateEmissions({
        tokenCount,
        model,
        hardware,
        dataCenter,
        customPue: options.pue,
        customCarbonIntensity: options.carbonIntensity,
        contextWindow: model.contextWindow
      })

      spinner.succeed('Calculation completed')

      // Output results
      switch (options.output) {
        case 'json':
          console.log(JSON.stringify(result, null, 2))
          break
        case 'csv':
          console.log('Metric,Value,Unit')
          console.log(`Energy,${result.energyKWh},kWh`)
          console.log(`Carbon Emissions,${result.totalEmissionsGrams},g CO₂`)
          console.log(`Per Token Emissions,${result.carbonEmissionsGrams},g CO₂/token`)
          console.log(`Lightbulb Equivalent,${result.equivalentLightbulbMinutes},minutes`)
          console.log(`Car Miles Equivalent,${result.equivalentCarMiles},miles`)
          console.log(`Tree Hours Equivalent,${result.equivalentTreeHours},hours`)
          break
        case 'table':
        default:
          console.log(chalk.green('\n📊 Calculation Results:'))
          console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
          console.log(`Tokens: ${chalk.bold(tokenCount.toLocaleString())}`)
          console.log(`Model: ${chalk.bold(model.name)}`)
          console.log(`Hardware: ${chalk.bold(hardware.name)}`)
          console.log(`Data Center: ${chalk.bold(dataCenter.name)}`)
          console.log(`PUE: ${chalk.bold(dataCenter.pue)}`)
          console.log(`Carbon Intensity: ${chalk.bold(dataCenter.carbonIntensity)} kg CO₂/kWh`)
          console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
          console.log(`⚡ Energy: ${chalk.yellow(result.energyKWh.toFixed(6))} kWh`)
          console.log(`🌍 Total Emissions: ${chalk.red(result.totalEmissionsGrams.toFixed(3))} g CO₂`)
          console.log(`📈 Per Token: ${chalk.red(result.carbonEmissionsGrams.toFixed(6))} g CO₂`)
          console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
          console.log(`💡 Lightbulb Equivalent: ${chalk.cyan(result.equivalentLightbulbMinutes.toFixed(1))} minutes`)
          console.log(`🚗 Car Miles Equivalent: ${chalk.cyan(result.equivalentCarMiles.toFixed(3))} miles`)
          console.log(`🌳 Tree Hours Equivalent: ${chalk.cyan(result.equivalentTreeHours.toFixed(1))} hours`)
          break
      }

      if (options.verbose) {
        console.log(chalk.gray('\n🔍 Detailed Information:'))
        console.log(`Energy (Joules): ${result.energyJoules.toExponential(3)} J`)
        console.log(`Model Complexity Factor: ${model.complexityFactor}`)
        console.log(`Hardware Efficiency: ${hardware.efficiency} tokens/W`)
        console.log(`Context Window Factor: ${(result.energyKWh / (result.energyJoules / 3600000)).toFixed(3)}`)
      }

    } catch (error) {
      spinner.fail('Calculation failed')
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error')
      process.exit(1)
    }
  })
