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

// Get calculations for a project with filtering
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { user_id, limit = 50, offset = 0, start_date, end_date, tag_ids } = req.query

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'user_id is required' 
      })
    }

    // Convert projectId to integer
    const projectIdInt = parseInt(projectId, 10)
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

    // Build WHERE clause with filters
    const whereConditions = ['c.project_id = $1']
    const queryParams: any[] = [projectIdInt]
    let paramIndex = 2

    if (start_date) {
      whereConditions.push(`c.created_at >= $${paramIndex}`)
      queryParams.push(new Date(start_date as string))
      paramIndex++
    }

    if (end_date) {
      whereConditions.push(`c.created_at <= $${paramIndex}`)
      queryParams.push(new Date(end_date as string))
      paramIndex++
    }

    // Handle tag filtering - Express parses multiple query params with same name as array
    if (tag_ids) {
      let tagIdsArray: number[] = []
      if (Array.isArray(tag_ids)) {
        tagIdsArray = tag_ids.map(id => parseInt(String(id))).filter(id => !isNaN(id))
      } else if (typeof tag_ids === 'string') {
        // Handle comma-separated string or single value
        tagIdsArray = tag_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      }
      
      if (tagIdsArray.length > 0) {
        // Build IN clause with individual parameters
        const inPlaceholders = tagIdsArray.map((_, i) => `$${paramIndex + i}`).join(', ')
        whereConditions.push(`c.id IN (
          SELECT DISTINCT calculation_id 
          FROM calculation_tags 
          WHERE tag_id IN (${inPlaceholders})
        )`)
        queryParams.push(...tagIdsArray)
        paramIndex += tagIdsArray.length
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // Build final params array with limit and offset
    const finalParams = [...queryParams, parseInt(limit as string), parseInt(offset as string)]
    const limitParamIndex = paramIndex
    const offsetParamIndex = paramIndex + 1

    // Get calculations with tags
    const queryString = `
      SELECT 
        c.id,
        c.token_count,
        c.model,
        c.context_length,
        c.context_window,
        c.hardware,
        c.data_center_provider,
        c.data_center_region,
        c.custom_pue,
        c.custom_carbon_intensity,
        c.calculation_parameters,
        c.results,
        c.created_at,
        c.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name,
              'color', t.color
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'::json
        ) as tags
      FROM calculations c
      LEFT JOIN calculation_tags ct ON c.id = ct.calculation_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC 
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `
    
    const result = await pool.query(queryString, finalParams)

    // Get total count with same filters
    // Rebuild params without tagIdsArray to avoid duplication
    const countParams: any[] = [projectIdInt]
    const countWhereConditions = ['c.project_id = $1']
    let countParamIndex = 2
    
    if (start_date) {
      countWhereConditions.push(`c.created_at >= $${countParamIndex}`)
      countParams.push(new Date(start_date as string))
      countParamIndex++
    }
    
    if (end_date) {
      countWhereConditions.push(`c.created_at <= $${countParamIndex}`)
      countParams.push(new Date(end_date as string))
      countParamIndex++
    }
    
    let countQuery = `
      SELECT COUNT(DISTINCT c.id) as total 
      FROM calculations c
    `
    
    if (tag_ids) {
      let tagIdsArray: number[] = []
      if (Array.isArray(tag_ids)) {
        tagIdsArray = tag_ids.map(id => parseInt(String(id))).filter(id => !isNaN(id))
      } else if (typeof tag_ids === 'string') {
        tagIdsArray = tag_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      }
      
      if (tagIdsArray.length > 0) {
        // Build IN clause with individual parameters
        const inPlaceholders = tagIdsArray.map((_, i) => `$${countParamIndex + i}`).join(', ')
        countQuery += `
          INNER JOIN calculation_tags ct ON c.id = ct.calculation_id
          WHERE ${countWhereConditions.join(' AND ')} AND ct.tag_id IN (${inPlaceholders})
        `
        countParams.push(...tagIdsArray)
        countParamIndex += tagIdsArray.length
      } else {
        countQuery += ` WHERE ${countWhereConditions.join(' AND ')}`
      }
    } else {
      countQuery += ` WHERE ${countWhereConditions.join(' AND ')}`
    }
    
    const countResult = await pool.query(countQuery, countParams)

    // Process results to format tags properly
    const calculations = result.rows.map(row => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.filter((tag: any) => tag.id !== null) : []
    }))

    res.json({ 
      success: true, 
      data: {
        calculations
      },
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error) {
    console.error('Error fetching calculations:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch calculations' 
    })
  }
})

// Create a new calculation
router.post('/', async (req, res) => {
  try {
    const {
      project_id,
      token_count,
      model,
      context_length,
      context_window,
      hardware,
      data_center_provider,
      data_center_region,
      custom_pue,
      custom_carbon_intensity,
      calculation_parameters,
      results,
      user_id
    } = req.body

    if (!project_id || !token_count || !model || !results || !user_id) {
      return res.status(400).json({ 
        error: 'project_id, token_count, model, results, and user_id are required' 
      })
    }

    // Verify project belongs to user and get preset
    const projectCheck = await pool.query(`
      SELECT id, calculation_preset_id FROM projects WHERE id = $1 AND user_id = $2
    `, [project_id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const projectPresetId = projectCheck.rows[0].calculation_preset_id
    const preset = getPresetById(projectPresetId)
    
    if (!preset) {
      return res.status(400).json({ 
        error: `Preset not found: ${projectPresetId}` 
      })
    }

    // Use preset values for context_length and context_window if not provided
    const finalContextLength = context_length ?? preset.configuration.contextLength
    const finalContextWindow = context_window ?? preset.configuration.contextWindow
    const finalHardware = hardware ?? preset.configuration.hardware
    const finalDataCenterProvider = data_center_provider ?? preset.configuration.dataCenterProvider
    const finalDataCenterRegion = data_center_region ?? preset.configuration.dataCenterRegion
    const finalCustomPue = custom_pue ?? preset.configuration.customPue
    const finalCustomCarbonIntensity = custom_carbon_intensity ?? preset.configuration.customCarbonIntensity

    const result = await pool.query(`
      INSERT INTO calculations (
        project_id, token_count, model, context_length, context_window,
        hardware, data_center_provider, data_center_region, custom_pue,
        custom_carbon_intensity, calculation_parameters, results
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      project_id, token_count, model, finalContextLength, finalContextWindow,
      finalHardware, finalDataCenterProvider, finalDataCenterRegion, finalCustomPue,
      finalCustomCarbonIntensity, calculation_parameters, results
    ])

    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating calculation:', error)
    res.status(500).json({ error: 'Failed to create calculation' })
  }
})

// Update a calculation
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      token_count,
      model,
      context_length,
      context_window,
      hardware,
      data_center_provider,
      data_center_region,
      custom_pue,
      custom_carbon_intensity,
      calculation_parameters,
      results,
      user_id
    } = req.body

    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'user_id is required' 
      })
    }

    const calculationIdInt = parseInt(id, 10)
    if (isNaN(calculationIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid calculation ID' 
      })
    }

    // Verify calculation belongs to user's project and get project preset
    const calculationCheck = await pool.query(`
      SELECT c.id, c.project_id, p.calculation_preset_id 
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [calculationIdInt, user_id])

    if (calculationCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Calculation not found' 
      })
    }

    const projectPresetId = calculationCheck.rows[0].calculation_preset_id
    const preset = getPresetById(projectPresetId)
    
    if (!preset) {
      return res.status(400).json({ 
        success: false,
        error: `Preset not found: ${projectPresetId}` 
      })
    }

    // Get current calculation values
    const currentCalc = await pool.query(`
      SELECT context_length, context_window, hardware, data_center_provider, 
             data_center_region, custom_pue, custom_carbon_intensity
      FROM calculations WHERE id = $1
    `, [calculationIdInt])

    const current = currentCalc.rows[0]

    // Use provided values if present, otherwise use preset values (not current values)
    // If null is explicitly passed, it means "use preset" - set to NULL in DB
    // If undefined is passed, keep current value
    const finalContextLength = context_length !== undefined 
      ? (context_length === null ? null : context_length)
      : preset.configuration.contextLength
    const finalContextWindow = context_window !== undefined 
      ? (context_window === null ? null : context_window)
      : preset.configuration.contextWindow
    const finalHardware = hardware !== undefined ? hardware : preset.configuration.hardware
    const finalDataCenterProvider = data_center_provider !== undefined ? data_center_provider : preset.configuration.dataCenterProvider
    const finalDataCenterRegion = data_center_region !== undefined ? data_center_region : preset.configuration.dataCenterRegion
    const finalCustomPue = custom_pue !== undefined ? custom_pue : preset.configuration.customPue
    const finalCustomCarbonIntensity = custom_carbon_intensity !== undefined ? custom_carbon_intensity : preset.configuration.customCarbonIntensity

    const result = await pool.query(`
      UPDATE calculations 
      SET 
        token_count = COALESCE($1, token_count),
        model = COALESCE($2, model),
        context_length = $3,
        context_window = $4,
        hardware = COALESCE($5, hardware),
        data_center_provider = COALESCE($6, data_center_provider),
        data_center_region = COALESCE($7, data_center_region),
        custom_pue = $8,
        custom_carbon_intensity = $9,
        calculation_parameters = COALESCE($10, calculation_parameters),
        results = COALESCE($11, results),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      token_count, model, finalContextLength, finalContextWindow,
      finalHardware, finalDataCenterProvider, finalDataCenterRegion, finalCustomPue,
      finalCustomCarbonIntensity, calculation_parameters, results, calculationIdInt
    ])

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating calculation:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to update calculation' 
    })
  }
})

// Delete a calculation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Verify calculation belongs to user's project
    const calculationCheck = await pool.query(`
      SELECT c.id FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [id, user_id])

    if (calculationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' })
    }

    const result = await pool.query(`
      DELETE FROM calculations WHERE id = $1 RETURNING id
    `, [id])

    res.json({ success: true, message: 'Calculation deleted successfully' })
  } catch (error) {
    console.error('Error deleting calculation:', error)
    res.status(500).json({ error: 'Failed to delete calculation' })
  }
})

// Recalculate a single calculation
router.post('/:id/recalculate', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    const calculationIdInt = parseInt(id, 10)
    if (isNaN(calculationIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid calculation ID' 
      })
    }

    // Get calculation with project info
    const calcResult = await pool.query(`
      SELECT c.*, p.calculation_preset_id
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [calculationIdInt, user_id])

    if (calcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' })
    }

    const calc = calcResult.rows[0]

    const preset = getPresetById(calc.calculation_preset_id)
    
    if (!preset) {
      return res.status(400).json({ 
        success: false,
        error: `Preset not found: ${calc.calculation_preset_id}` 
      })
    }

    // Use preset values for context_length and context_window
    // If calculation has NULL context values, use preset; otherwise use stored values (they're overrides)
    const usePresetContext = calc.context_length === null || calc.context_length === undefined ||
                             calc.context_window === null || calc.context_window === undefined
    
    const formData: TokenCalculatorFormData = {
      tokenCount: calc.token_count,
      model: calc.model,
      contextLength: usePresetContext ? preset.configuration.contextLength : calc.context_length,
      contextWindow: usePresetContext ? preset.configuration.contextWindow : calc.context_window,
      hardware: calc.hardware || preset.configuration.hardware,
      dataCenterProvider: calc.data_center_provider || preset.configuration.dataCenterProvider,
      dataCenterRegion: calc.data_center_region || preset.configuration.dataCenterRegion,
      customPue: calc.custom_pue || preset.configuration.customPue,
      customCarbonIntensity: calc.custom_carbon_intensity || preset.configuration.customCarbonIntensity,
    }

    // Recalculate using the calculation engine
    const newResults = sustainableAICalculator.calculateFromFormData(formData)

    // Update calculation with new results
    // Keep context values as NULL if they were NULL (indicating "use preset")
    // Only update results, not context values (they should remain NULL to indicate preset usage)
    const updatedResult = await pool.query(`
      UPDATE calculations 
      SET 
        results = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [
      JSON.stringify(newResults),
      calculationIdInt
    ])

    res.json({ success: true, data: updatedResult.rows[0] })
  } catch (error) {
    console.error('Error recalculating calculation:', error)
    res.status(500).json({ error: 'Failed to recalculate calculation' })
  }
})

// Recalculate multiple calculations
router.post('/bulk-recalculate', async (req, res) => {
  try {
    const { calculation_ids, user_id } = req.body

    if (!calculation_ids || !Array.isArray(calculation_ids) || !user_id) {
      return res.status(400).json({ 
        error: 'calculation_ids array and user_id are required' 
      })
    }

    // Get all calculations with their project presets
    const calcResult = await pool.query(`
      SELECT c.*, p.calculation_preset_id
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = ANY($1::INTEGER[]) AND p.user_id = $2
    `, [calculation_ids, user_id])

    if (calcResult.rows.length !== calculation_ids.length) {
      return res.status(400).json({ error: 'Some calculations not found or access denied' })
    }

    const updatedIds: number[] = []

    // Recalculate each calculation
    for (const calc of calcResult.rows) {
      const preset = getPresetById(calc.calculation_preset_id)
      
      if (!preset) {
        console.error(`Preset not found for calculation ${calc.id}: ${calc.calculation_preset_id}`)
        continue
      }

      // Use preset values for context_length and context_window
      // If calculation has NULL context values, use preset; otherwise use stored values (they're overrides)
      const usePresetContext = calc.context_length === null || calc.context_length === undefined ||
                               calc.context_window === null || calc.context_window === undefined
      
      const formData: TokenCalculatorFormData = {
        tokenCount: calc.token_count,
        model: calc.model,
        contextLength: usePresetContext ? preset.configuration.contextLength : calc.context_length,
        contextWindow: usePresetContext ? preset.configuration.contextWindow : calc.context_window,
        hardware: calc.hardware || preset.configuration.hardware,
        dataCenterProvider: calc.data_center_provider || preset.configuration.dataCenterProvider,
        dataCenterRegion: calc.data_center_region || preset.configuration.dataCenterRegion,
        customPue: calc.custom_pue || preset.configuration.customPue,
        customCarbonIntensity: calc.custom_carbon_intensity || preset.configuration.customCarbonIntensity,
      }

      // Recalculate using the calculation engine
      const newResults = sustainableAICalculator.calculateFromFormData(formData)

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

      updatedIds.push(calc.id)
    }

    res.json({ 
      success: true, 
      data: { 
        updatedCount: updatedIds.length,
        calculationIds: updatedIds
      }
    })
  } catch (error) {
    console.error('Error bulk recalculating:', error)
    res.status(500).json({ error: 'Failed to bulk recalculate calculations' })
  }
})

// Delete a calculation
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      })
    }

    const calculationIdInt = parseInt(id, 10)
    if (isNaN(calculationIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid calculation ID'
      })
    }

    // Verify calculation belongs to user's project
    const calcCheck = await pool.query(`
      SELECT c.id
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [calculationIdInt, user_id])

    if (calcCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Calculation not found'
      })
    }

    await pool.query(`
      DELETE FROM calculations WHERE id = $1
    `, [calculationIdInt])

    res.json({
      success: true,
      message: 'Calculation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting calculation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete calculation'
    })
  }
})

// Bulk delete calculations
router.post('/bulk-delete', async (req, res) => {
  try {
    const { calculation_ids, user_id } = req.body

    if (!calculation_ids || !Array.isArray(calculation_ids) || calculation_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'calculation_ids array is required'
      })
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      })
    }

    // Verify all calculations belong to user's projects
    const calcCheck = await pool.query(`
      SELECT c.id
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = ANY($1::INTEGER[]) AND p.user_id = $2
    `, [calculation_ids, user_id])

    if (calcCheck.rows.length !== calculation_ids.length) {
      return res.status(403).json({
        success: false,
        error: 'Some calculations not found or access denied'
      })
    }

    await pool.query(`
      DELETE FROM calculations WHERE id = ANY($1::INTEGER[])
    `, [calculation_ids])

    res.json({
      success: true,
      message: `${calculation_ids.length} calculation(s) deleted successfully`
    })
  } catch (error) {
    console.error('Error bulk deleting calculations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete calculations'
    })
  }
})

// Bulk import calculations
router.post('/bulk-import', async (req, res) => {
  try {
    const { project_id, calculations, user_id } = req.body

    if (!project_id || !calculations || !Array.isArray(calculations) || !user_id) {
      return res.status(400).json({ 
        error: 'project_id, calculations array, and user_id are required' 
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [project_id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Start transaction
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
          project_id, calc.token_count, calc.model, calc.context_length, calc.context_window,
          calc.hardware, calc.data_center_provider, calc.data_center_region, calc.custom_pue,
          calc.custom_carbon_intensity, calc.calculation_parameters, calc.results
        ])

        insertedCalculations.push(result.rows[0].id)
      }

      await pool.query('COMMIT')

      res.status(201).json({ 
        success: true, 
        data: { 
          insertedCount: insertedCalculations.length,
          calculationIds: insertedCalculations
        }
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error bulk importing calculations:', error)
    res.status(500).json({ error: 'Failed to bulk import calculations' })
  }
})

export default router
