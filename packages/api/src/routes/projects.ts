import { Router } from 'express'
import { Pool } from 'pg'
import { sustainableAICalculator } from '@susai/core'
import type { TokenCalculatorFormData, TokenCalculatorPreset } from '@susai/types'
import { fetchModelFromDB } from '../services/modelService'

const router = Router()

// PostgreSQL database connection - required
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

// Helper function to fetch preset from database
async function fetchPresetFromDB(presetId: string): Promise<TokenCalculatorPreset | null> {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, description, configuration, user_id,
        created_at, updated_at
      FROM presets
      WHERE id = $1
    `, [presetId])

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      configuration: row.configuration as TokenCalculatorFormData,
      userId: row.user_id || undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }
  } catch (error) {
    console.error('Error fetching preset from database:', error)
    return null
  }
}

// Test PostgreSQL connection on startup
pool.query('SELECT 1')
  .then(() => {
    console.log('PostgreSQL connection established successfully')
  })
  .catch((error) => {
    console.error('Failed to connect to PostgreSQL:', error)
    process.exit(1)
  })

// Get all projects for a user
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // First check if projects table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('Projects table does not exist, returning empty array')
      return res.json({ success: true, data: [] })
    }

    const result = await pool.query(`
      SELECT 
        p.*,
        COUNT(c.id) as calculation_count,
        COALESCE(SUM((c.results->>'totalEmissionsGrams')::DECIMAL), 0) as total_emissions_grams,
        COALESCE(SUM((c.results->>'energyJoules')::DECIMAL), 0) as total_energy_joules
      FROM projects p
      LEFT JOIN calculations c ON p.id = c.project_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [user_id])

    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get a specific project with calculations
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'user_id is required' 
      })
    }

    // Convert id to integer for database queries
    const projectIdInt = parseInt(id, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      })
    }

    // Get project details
    const projectResult = await pool.query(`
      SELECT * FROM projects 
      WHERE id = $1 AND user_id = $2
    `, [projectIdInt, user_id])

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      })
    }

    // Get project analytics - try function first, fallback to direct query
    let analytics: any = null
    try {
      const analyticsResult = await pool.query(`
        SELECT get_project_analytics($1::INTEGER, NULL::TIMESTAMP WITH TIME ZONE, NULL::TIMESTAMP WITH TIME ZONE) as analytics
      `, [projectIdInt])
      analytics = analyticsResult.rows[0]?.analytics
    } catch (funcError) {
      // If function fails due to ambiguity, compute analytics directly
      console.warn('Function call failed, computing analytics directly:', funcError)
      const directResult = await pool.query(`
        SELECT 
          COALESCE(SUM((results->>'totalEmissionsGrams')::DECIMAL), 0) as totalEmissionsGrams,
          COALESCE(SUM((results->>'energyJoules')::DECIMAL), 0) as totalEnergyJoules,
          COALESCE(AVG((results->>'carbonEmissionsGrams')::DECIMAL), 0) as averageEmissionsPerToken,
          COUNT(*) as calculationCount,
          MIN(created_at) as start_date,
          MAX(created_at) as end_date
        FROM calculations
        WHERE project_id = $1
      `, [projectIdInt])
      
      const row = directResult.rows[0]
      analytics = {
        totalEmissionsGrams: parseFloat(row.totalemissionsgrams || '0'),
        totalEnergyJoules: parseFloat(row.totalenergyjoules || '0'),
        averageEmissionsPerToken: parseFloat(row.averageemissionspertoken || '0'),
        calculationCount: parseInt(row.calculationcount || '0', 10),
        dateRange: {
          start: row.start_date || null,
          end: row.end_date || null
        }
      }
    }

    // Get recent calculations
    const calculationsResult = await pool.query(`
      SELECT 
        id,
        token_count,
        model,
        results,
        created_at
      FROM calculations 
      WHERE project_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [projectIdInt])

    res.json({
      success: true,
      data: {
        project: projectResult.rows[0],
        analytics: analytics || {
          totalEmissionsGrams: 0,
          totalEnergyJoules: 0,
          averageEmissionsPerToken: 0,
          calculationCount: 0,
          dateRange: { start: null, end: null }
        },
        recentCalculations: calculationsResult.rows
      }
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// Create a new project
router.post('/', async (req, res) => {
  try {
    console.log('Creating project with body:', req.body)
    const { name, description, calculation_preset_id, user_id } = req.body

    if (!name || !calculation_preset_id || !user_id) {
      console.log('Missing required fields:', { name, calculation_preset_id, user_id })
      return res.status(400).json({ 
        error: 'name, calculation_preset_id, and user_id are required' 
      })
    }

    // First check if projects table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('Projects table does not exist')
      return res.status(500).json({ 
        error: 'Database not initialized. Please run database setup first.' 
      })
    }

    const result = await pool.query(`
      INSERT INTO projects (name, description, calculation_preset_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, calculation_preset_id, user_id])

    console.log('Project created successfully:', result.rows[0])
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, calculation_preset_id, user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'user_id is required' 
      })
    }

    // Convert id to integer
    const projectIdInt = parseInt(id, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      })
    }

    const result = await pool.query(`
      UPDATE projects 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          calculation_preset_id = COALESCE($3, calculation_preset_id),
          updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [name, description, calculation_preset_id, projectIdInt, user_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to update project' 
    })
  }
})

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    const result = await pool.query(`
      DELETE FROM projects 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, user_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({ success: true, message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// Get project emissions timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id, start_date, end_date, interval = 'day' } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Convert id to integer
    const projectIdInt = parseInt(id, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [projectIdInt, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Project not found' 
      })
    }

    const result = await pool.query(`
      SELECT * FROM get_project_emissions_timeline($1::INTEGER, $2, $3, $4)
    `, [projectIdInt, start_date, end_date, interval])

    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching project timeline:', error)
    res.status(500).json({ error: 'Failed to fetch project timeline' })
  }
})

// Recalculate project emissions
router.post('/:id/recalculate', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id, algorithm_version } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Convert id to integer
    const projectIdInt = parseInt(id, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      })
    }

    // Verify project belongs to user and get preset
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
    const preset = await fetchPresetFromDB(projectPresetId)
    
    if (!preset) {
      return res.status(400).json({ 
        success: false,
        error: `Preset not found: ${projectPresetId}` 
      })
    }

    // Get all calculations for this project
    const calcResult = await pool.query(`
      SELECT c.*
      FROM calculations c
      WHERE c.project_id = $1
    `, [projectIdInt])

    let updatedCount = 0

    // Recalculate each calculation
    for (const calc of calcResult.rows) {
      // Use preset values for context_window
      // If calculation has NULL context_window, use preset; otherwise use stored value (it's an override)
      const usePresetContext = calc.context_window === null || calc.context_window === undefined
      
      // Determine customPue and customCarbonIntensity
      // If DB has NULL, use preset value (which may be undefined for region defaults)
      const finalCustomPue = calc.custom_pue !== null && calc.custom_pue !== undefined 
        ? calc.custom_pue 
        : preset.configuration.customPue
      const finalCustomCarbonIntensity = calc.custom_carbon_intensity !== null && calc.custom_carbon_intensity !== undefined
        ? calc.custom_carbon_intensity
        : preset.configuration.customCarbonIntensity
      
      const formData: TokenCalculatorFormData = {
        tokenCount: calc.token_count,
        model: calc.model,
        contextWindow: usePresetContext ? preset.configuration.contextWindow : calc.context_window,
        // Always use current preset values for hardware/provider/region when recalculating
        // This ensures consistency with the current preset configuration
        hardware: preset.configuration.hardware,
        dataCenterProvider: preset.configuration.dataCenterProvider,
        dataCenterRegion: preset.configuration.dataCenterRegion,
        customPue: finalCustomPue,
        customCarbonIntensity: finalCustomCarbonIntensity,
      }

      // Debug logging for first calculation
      if (updatedCount === 0) {
        console.log('Recalculating calculation:', {
          id: calc.id,
          tokenCount: calc.token_count,
          model: calc.model,
          hardware: formData.hardware,
          dataCenterProvider: formData.dataCenterProvider,
          dataCenterRegion: formData.dataCenterRegion,
          customPue: formData.customPue,
          customCarbonIntensity: formData.customCarbonIntensity,
          contextWindow: formData.contextWindow,
          presetId: projectPresetId
        })
      }

      // Fetch model from database
      const model = await fetchModelFromDB(formData.model)
      if (!model) {
        throw new Error(`Model '${formData.model}' not found`)
      }

      // Recalculate using the calculation engine
      const newResults = sustainableAICalculator.calculateFromFormData(formData, model)

      // Debug logging for first calculation
      if (updatedCount === 0) {
        console.log('Recalculation results:', {
          totalEmissionsGrams: newResults.totalEmissionsGrams,
          energyJoules: newResults.energyJoules,
          energyKWh: newResults.energyKWh
        })
      }

      // Update calculation with new results
      await pool.query(`
        UPDATE calculations 
        SET 
          results = $1,
          updated_at = NOW()
        WHERE id = $2
      `, [
        JSON.stringify(newResults),
        calc.id
      ])

      updatedCount++
    }

    res.json({ 
      success: true, 
      data: { 
        updatedCount,
        algorithmVersion: algorithm_version || '1.0.0'
      }
    })
  } catch (error) {
    console.error('Error recalculating project:', error)
    res.status(500).json({ error: 'Failed to recalculate project' })
  }
})

export default router
