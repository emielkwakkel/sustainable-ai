import { Router } from 'express'
import { Pool } from 'pg'
import { sustainableAICalculator } from '@susai/core'
import type { TokenCalculatorFormData } from '@susai/types'

const router = Router()

// Project preset configurations (matching frontend presets)
interface ProjectPreset {
  id: string
  name: string
  description: string
  configuration: TokenCalculatorFormData
}

// Default presets matching frontend usePresets composable
const projectPresets: ProjectPreset[] = [
  {
    id: 'gpt-4-research',
    name: 'GPT-4 Token Research',
    description: 'Based on Anu\'s Substack article "We can use tokens to track AI\'s carbon"',
    configuration: {
      tokenCount: 200,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenterProvider: 'aws',
      dataCenterRegion: 'aws-asia-pacific-tokyo',
      customPue: 1.1,
      customCarbonIntensity: undefined,
    },
  },
  {
    id: 'cursor-ai',
    name: 'Cursor.ai',
    description: 'Based on Cursor\'s actual infrastructure as reported in The Pragmatic Engineer',
    configuration: {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-h100',
      dataCenterProvider: 'azure',
      dataCenterRegion: 'azure-virginia',
      customPue: undefined,
      customCarbonIntensity: undefined,
    },
  },
]

function getPresetById(id: string): ProjectPreset | undefined {
  return projectPresets.find(preset => preset.id === id)
}

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

interface CSVRow {
  Date: string
  Kind: string
  Model: string
  'Max Mode': string
  'Input (w/ Cache Write)': string
  'Input (w/o Cache Write)': string
  'Cache Read': string
  'Output Tokens': string
  'Total Tokens': string
  Cost: string
}

// Parse CSV text into array of objects
function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted values with commas
    const values: string[] = []
    let currentValue = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim())
        currentValue = ''
      } else {
        currentValue += char
      }
    }
    values.push(currentValue.trim())

    if (values.length === headers.length) {
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index].replace(/^"|"$/g, '')
      })
      rows.push(row as CSVRow)
    }
  }

  return rows
}

// Check if a calculation with the same datetime already exists
async function checkDuplicate(projectId: number, dateString: string): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT id FROM calculations 
      WHERE project_id = $1 
      AND calculation_parameters->>'date' = $2
      LIMIT 1
    `, [projectId, dateString])

    return result.rows.length > 0
  } catch (error) {
    console.error('Error checking duplicate:', error)
    return false
  }
}

// Convert CSV row to calculation with API call
async function convertCSVRowToCalculation(
  row: CSVRow,
  projectId: number,
  projectPresetId: string
): Promise<any> {
  const totalTokens = parseInt(row['Total Tokens'] || '0')
  if (totalTokens <= 0) {
    throw new Error('Invalid token count')
  }

  // Get preset configuration
  const preset = getPresetById(projectPresetId)
  if (!preset) {
    throw new Error(`Preset not found: ${projectPresetId}`)
  }

  // Map CSV model to our model format (use CSV model if available, otherwise use preset model)
  const csvModel = row.Model || 'auto'
  const modelId = csvModel !== 'auto' ? mapCSVModelToOurModel(csvModel) : preset.configuration.model

  // Use preset configuration as base, but override with CSV token count
  const formData: TokenCalculatorFormData = {
    tokenCount: totalTokens,
    model: modelId,
    contextLength: preset.configuration.contextLength,
    contextWindow: preset.configuration.contextWindow,
    hardware: preset.configuration.hardware,
    dataCenterProvider: preset.configuration.dataCenterProvider,
    dataCenterRegion: preset.configuration.dataCenterRegion,
    customPue: preset.configuration.customPue,
    customCarbonIntensity: preset.configuration.customCarbonIntensity,
  }

  // Call calculation API
  const calculationResult = sustainableAICalculator.calculateFromFormData(formData)

  return {
    project_id: projectId,
    token_count: totalTokens,
    model: modelId,
    context_length: formData.contextLength,
    context_window: formData.contextWindow,
    hardware: formData.hardware,
    data_center_provider: formData.dataCenterProvider,
    data_center_region: formData.dataCenterRegion,
    custom_pue: formData.customPue || null,
    custom_carbon_intensity: formData.customCarbonIntensity || null,
    calculation_parameters: {
      date: row.Date,
      kind: row.Kind,
      model: row.Model,
      maxMode: row['Max Mode'],
      inputWithCache: parseInt(row['Input (w/ Cache Write)'] || '0'),
      inputWithoutCache: parseInt(row['Input (w/o Cache Write)'] || '0'),
      cacheRead: parseInt(row['Cache Read'] || '0'),
      outputTokens: parseInt(row['Output Tokens'] || '0'),
      totalTokens: totalTokens,
      cost: parseFloat(row.Cost || '0'),
    },
    results: calculationResult,
  }
}

// Map CSV model names to our model IDs
function mapCSVModelToOurModel(csvModel: string): string {
  const modelMapping: { [key: string]: string } = {
    'gpt-4': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'claude-3-opus': 'claude-3-opus',
    'claude-3-sonnet': 'claude-3-sonnet',
    'auto': 'gpt-4',
  }

  return modelMapping[csvModel.toLowerCase()] || 'gpt-4'
}

// Health check for CSV import route
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'CSV import route is available' 
  })
})

// Import CSV data
router.post('/import', async (req, res) => {
  try {
    const { project_id, csv_data, user_id } = req.body

    if (!project_id || !csv_data || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id, csv_data, and user_id are required',
      })
    }

    // Convert project_id to integer
    const projectIdInt = typeof project_id === 'string' ? parseInt(project_id, 10) : project_id
    if (isNaN(projectIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project_id',
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id, calculation_preset_id FROM projects WHERE id = $1 AND user_id = $2
    `, [projectIdInt, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      })
    }

    const projectPresetId = projectCheck.rows[0].calculation_preset_id

    // Parse CSV
    const csvRows = parseCSV(csv_data)
    if (csvRows.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No valid CSV data found' 
      })
    }

    // Process rows
    const imported = []
    const skipped = []
    const errors = []

    await pool.query('BEGIN')

    try {
      for (const row of csvRows) {
        try {
          // Check for duplicate by datetime
          const isDuplicate = await checkDuplicate(projectIdInt, row.Date)
          if (isDuplicate) {
            skipped.push({
              date: row.Date,
              reason: 'duplicate',
            })
            continue
          }

          // Convert to calculation
          const calculation = await convertCSVRowToCalculation(
            row,
            projectIdInt,
            projectPresetId
          )

          // Parse date from CSV row (ISO 8601 format)
          // Remove quotes if present and parse the date
          const dateString = row.Date?.replace(/^"|"$/g, '').trim() || ''
          let createdAt: Date
          
          if (dateString) {
            const csvDate = new Date(dateString)
            if (isNaN(csvDate.getTime())) {
              console.warn(`Invalid date format: ${row.Date}, using current date`)
              createdAt = new Date()
            } else {
              createdAt = csvDate
            }
          } else {
            console.warn(`Missing date in CSV row, using current date`)
            createdAt = new Date()
          }
          
          // Log for debugging (remove in production)
          console.log(`CSV Date: ${row.Date} -> Parsed: ${createdAt.toISOString()}`)

          // Insert into database with date from CSV
          // Pass Date object directly - pg library will handle conversion
          const result = await pool.query(`
            INSERT INTO calculations (
              project_id, token_count, model, context_length, context_window,
              hardware, data_center_provider, data_center_region, custom_pue,
              custom_carbon_intensity, calculation_parameters, results, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING id, created_at
          `, [
            calculation.project_id,
            calculation.token_count,
            calculation.model,
            calculation.context_length,
            calculation.context_window,
            calculation.hardware,
            calculation.data_center_provider,
            calculation.data_center_region,
            calculation.custom_pue,
            calculation.custom_carbon_intensity,
            JSON.stringify(calculation.calculation_parameters),
            JSON.stringify(calculation.results),
            createdAt, // Pass Date object directly
          ])

          imported.push({
            id: result.rows[0].id,
            date: row.Date,
            tokens: calculation.token_count,
          })
        } catch (error) {
          console.error('Error processing row:', error)
          errors.push({
            date: row.Date,
            reason: error instanceof Error ? error.message : 'unknown error',
          })
        }
      }

      await pool.query('COMMIT')

      res.status(201).json({
        success: true,
        data: {
          totalProcessed: csvRows.length,
          imported: imported.length,
          skipped: skipped.length,
          errors: errors.length,
          importedEntries: imported,
          skippedEntries: skipped,
          errorEntries: errors,
        },
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error importing CSV:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to import CSV data',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router

