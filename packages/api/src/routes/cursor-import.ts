import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

// Test Cursor API connection
router.post('/test-connection', async (req, res) => {
try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'Token is required' 
      })
    }

    // Test API connection with a simple request
    // Note: This is a mock implementation since we don't have the actual Cursor API endpoint
    // In a real implementation, you would make a request to the actual Cursor API
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock validation - in real implementation, you would validate against actual Cursor API
      if (token.length < 10) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        })
      }

      res.json({
        success: true,
        message: 'Connection successful'
      })
    } catch (apiError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or API access denied'
      })
    }
  } catch (error) {
    console.error('Error testing Cursor API connection:', error)
    res.status(500).json({ 
      success: false,
      message: 'Failed to test connection' 
    })
  }
})

// Import usage data from Cursor API
router.post('/import', async (req, res) => {
  try {
    const { 
      project_id, 
      start_date, 
      end_date, 
      api_token, 
      user_id 
    } = req.body

    if (!project_id || !start_date || !end_date || !api_token || !user_id) {
      return res.status(400).json({ 
        error: 'project_id, start_date, end_date, api_token, and user_id are required' 
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [project_id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Fetch usage data from Cursor API
    const usageData = await fetchCursorUsageData(api_token, start_date, end_date)
    
    if (!usageData || usageData.length === 0) {
      return res.json({ 
        success: true, 
        data: { 
          importedCount: 0, 
          message: 'No usage data found for the specified date range' 
        }
      })
    }

    // Store raw import data
    const importResult = await pool.query(`
      INSERT INTO cursor_imports (project_id, start_date, end_date, raw_data, status)
      VALUES ($1, $2, $3, $4, 'completed')
      RETURNING id
    `, [project_id, start_date, end_date, JSON.stringify(usageData)])

    const importId = importResult.rows[0].id

    // Convert usage data to calculations
    const calculations = await convertUsageDataToCalculations(usageData, project_id)
    
    if (calculations.length === 0) {
      return res.json({ 
        success: true, 
        data: { 
          importedCount: 0, 
          message: 'No valid calculations could be created from the usage data' 
        }
      })
    }

    // Bulk insert calculations
    await pool.query('BEGIN')
    
    try {
      const insertedCalculations = []
      
      for (const calc of calculations) {
        const result = await pool.query(`
          INSERT INTO calculations (
            project_id, token_count, model, context_length, context_window,
            hardware, data_center_provider, data_center_region, custom_pue,
            custom_carbon_intensity, calculation_parameters, results
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id
        `, [
          calc.project_id, calc.token_count, calc.model, calc.context_length, calc.context_window,
          calc.hardware, calc.data_center_provider, calc.data_center_region, calc.custom_pue,
          calc.custom_carbon_intensity, calc.calculation_parameters, calc.results
        ])

        insertedCalculations.push(result.rows[0].id)
      }

      await pool.query('COMMIT')

      res.status(201).json({ 
        success: true, 
        data: { 
          importId,
          importedCount: insertedCalculations.length,
          calculationIds: insertedCalculations,
          dateRange: { start_date, end_date }
        }
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error importing Cursor data:', error)
    res.status(500).json({ error: 'Failed to import Cursor data' })
  }
})

// Get import history for a project
router.get('/history/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [projectId, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const result = await pool.query(`
      SELECT 
        id,
        start_date,
        end_date,
        imported_at,
        status,
        jsonb_array_length(raw_data) as record_count
      FROM cursor_imports 
      WHERE project_id = $1 
      ORDER BY imported_at DESC
    `, [projectId])

    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching import history:', error)
    res.status(500).json({ error: 'Failed to fetch import history' })
  }
})

// Helper function to fetch usage data from Cursor API
async function fetchCursorUsageData(apiToken: string, startDate: string, endDate: string) {
  try {
    const response = await fetch('https://api.cursor.com/v1/usage', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      // Add query parameters for date range
      // Note: This is a placeholder - actual Cursor API endpoints may differ
    })

    if (!response.ok) {
      throw new Error(`Cursor API request failed: ${response.status}`)
    }

    const data = await response.json() as any
    return data.usage || data // Adjust based on actual API response structure
  } catch (error) {
    console.error('Error fetching Cursor usage data:', error)
    throw error
  }
}

// Helper function to convert Cursor usage data to calculation format
async function convertUsageDataToCalculations(usageData: any[], projectId: string) {
  const calculations = []

  for (const record of usageData) {
    try {
      // Map Cursor API data to our calculation format
      const calculation = {
        project_id: projectId,
        token_count: record.totalTokens || record.total_tokens || 0,
        model: mapCursorModelToOurModel(record.model || record.Model),
        context_length: 8000, // Default, could be derived from model
        context_window: 1250,  // Default, could be derived from model
        hardware: 'nvidia-a100', // Default hardware assumption
        data_center_provider: 'aws', // Default provider
        data_center_region: 'aws-us-east-1', // Default region
        custom_pue: null,
        custom_carbon_intensity: null,
        calculation_parameters: {
          inputTokens: record.inputTokens || record.input_tokens || 0,
          outputTokens: record.outputTokens || record.output_tokens || 0,
          cacheRead: record.cacheRead || record.cache_read || 0,
          cost: record.cost || record.Cost || 0,
          kind: record.kind || record.Kind || 'unknown',
          maxMode: record.maxMode || record.max_mode || 'No'
        },
        results: {
          // Placeholder - these would be calculated using our algorithm
          energyJoules: 0,
          energyKWh: 0,
          carbonEmissionsGrams: 0,
          totalEmissionsGrams: 0,
          equivalentLightbulbMinutes: 0,
          equivalentCarMiles: 0,
          equivalentTreeHours: 0,
          calculationVersion: '1.0.0',
          algorithmHash: 'placeholder'
        }
      }

      calculations.push(calculation)
    } catch (error) {
      console.error('Error converting usage record:', error)
      // Continue with other records
    }
  }

  return calculations
}

// Helper function to map Cursor model names to our model IDs
function mapCursorModelToOurModel(cursorModel: string): string {
  const modelMapping: { [key: string]: string } = {
    'gpt-4': 'gpt-4',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
    'claude-3-opus': 'claude-3-opus',
    'claude-3-sonnet': 'claude-3-sonnet',
    'auto': 'gpt-4', // Default mapping for auto model
  }

  return modelMapping[cursorModel] || 'gpt-4'
}

export default router
