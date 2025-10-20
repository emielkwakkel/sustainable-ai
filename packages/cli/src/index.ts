#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import { calculateCommand } from './commands/calculate'
import { configCommand } from './commands/config'
import { listCommand } from './commands/list'

const program = new Command()

program
  .name('sustainable-ai')
  .description('Sustainable AI Platform CLI - Calculate carbon emissions for AI model usage')
  .version('1.0.0')

// Add commands
program.addCommand(calculateCommand)
program.addCommand(configCommand)
program.addCommand(listCommand)

// Global error handler
program.configureHelp({
  sortSubcommands: true,
  sortOptions: true
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error.message)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('Unhandled Rejection:'), reason)
  process.exit(1)
})

// Parse arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.help()
}
