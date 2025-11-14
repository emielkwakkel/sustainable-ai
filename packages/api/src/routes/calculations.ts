import { Router } from 'express'
import { Pool } from 'pg'
import { sustainableAICalculator } from '@susai/core'
import type { TokenCalculatorFormData } from '@susai/types'
import { getPresetById } from '@susai/config'
import { fetchModelFromDB } from '../services/modelService'

const router = Router()

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

    // Get calculations with tags and model names
    const queryString = `
      SELECT 
        c.id,
        c.token_count,
        c.model,
        COALESCE(m.name, c.model) as model_name,
        c.context_length,
        c.context_window,
        c.hardware,
        c.data_center_provider,
        c.data_center_region,
        c.custom_pue,
        c.custom_carbon_intensity,
        c.calculation_parameters,
        c.cache_read,
        c.output_tokens,
        c.input_with_cache,
        c.input_without_cache,
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
      LEFT JOIN ai_models m ON (
        (c.model SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' AND c.model = m.id::text)
        OR
        (c.model NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' AND LOWER(c.model) = LOWER(m.name))
      )
      LEFT JOIN calculation_tags ct ON c.id = ct.calculation_id
      LEFT JOIN tags t ON ct.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY c.id, m.name
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
    // Ensure detailed token fields are always present (even if NULL in database or missing from row)
    const calculations = result.rows.map(row => {
      // Explicitly extract fields, handling both null and undefined
      const calculation: any = {
        ...row,
        // Ensure detailed token fields are always present
        // PostgreSQL returns null for NULL values, but we want to ensure they're always in the response
        cache_read: ('cache_read' in row && row.cache_read !== undefined) ? row.cache_read : null,
        output_tokens: ('output_tokens' in row && row.output_tokens !== undefined) ? row.output_tokens : null,
        input_with_cache: ('input_with_cache' in row && row.input_with_cache !== undefined) ? row.input_with_cache : null,
        input_without_cache: ('input_without_cache' in row && row.input_without_cache !== undefined) ? row.input_without_cache : null,
        tags: Array.isArray(row.tags) ? row.tags.filter((tag: any) => tag.id !== null) : []
      }
      return calculation
    })

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

// Get a single calculation by ID
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

    const calculationIdInt = parseInt(id, 10)
    if (isNaN(calculationIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid calculation ID' 
      })
    }

    // Get calculation with project info to verify ownership
    const result = await pool.query(`
      SELECT 
        c.id,
        c.token_count,
        c.model,
        COALESCE(m.name, c.model) as model_name,
        c.context_length,
        c.context_window,
        c.hardware,
        c.data_center_provider,
        c.data_center_region,
        c.custom_pue,
        c.custom_carbon_intensity,
        c.calculation_parameters,
        c.cache_read,
        c.output_tokens,
        c.input_with_cache,
        c.input_without_cache,
        c.results,
        c.created_at,
        c.updated_at
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN ai_models m ON (
        (c.model SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' AND c.model = m.id::text)
        OR
        (c.model NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' AND LOWER(c.model) = LOWER(m.name))
      )
      WHERE c.id = $1 AND p.user_id = $2
    `, [calculationIdInt, user_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Calculation not found' 
      })
    }

    const calculation = result.rows[0]
    
    // Debug: Log what we got from the database
    console.log('GET /calculations/:id - Raw calculation from DB:', {
      id: calculation.id,
      cache_read: calculation.cache_read,
      output_tokens: calculation.output_tokens,
      input_with_cache: calculation.input_with_cache,
      input_without_cache: calculation.input_without_cache,
      hasCacheRead: 'cache_read' in calculation,
      hasOutputTokens: 'output_tokens' in calculation,
      hasInputWithCache: 'input_with_cache' in calculation,
      hasInputWithoutCache: 'input_without_cache' in calculation,
    })
    
    // Ensure detailed token fields are always present
    // Explicitly set them to handle both null and undefined cases
    const response: any = {
      id: calculation.id,
      project_id: calculation.project_id,
      token_count: calculation.token_count,
      model: calculation.model,
      context_length: calculation.context_length,
      context_window: calculation.context_window,
      hardware: calculation.hardware,
      data_center_provider: calculation.data_center_provider,
      data_center_region: calculation.data_center_region,
      custom_pue: calculation.custom_pue,
      custom_carbon_intensity: calculation.custom_carbon_intensity,
      calculation_parameters: calculation.calculation_parameters,
      results: calculation.results,
      created_at: calculation.created_at,
      updated_at: calculation.updated_at,
      // Explicitly set detailed token fields - always include them, use null if not present
      cache_read: ('cache_read' in calculation) ? (calculation.cache_read ?? null) : null,
      output_tokens: ('output_tokens' in calculation) ? (calculation.output_tokens ?? null) : null,
      input_with_cache: ('input_with_cache' in calculation) ? (calculation.input_with_cache ?? null) : null,
      input_without_cache: ('input_without_cache' in calculation) ? (calculation.input_without_cache ?? null) : null,
    }

    console.log('GET /calculations/:id - Response being sent:', {
      id: response.id,
      cache_read: response.cache_read,
      output_tokens: response.output_tokens,
      input_with_cache: response.input_with_cache,
      input_without_cache: response.input_without_cache,
    })

    res.json({ 
      success: true, 
      data: response
    })
  } catch (error) {
    console.error('Error fetching calculation:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch calculation' 
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
      cache_read,
      output_tokens,
      input_with_cache,
      input_without_cache,
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
        custom_carbon_intensity, calculation_parameters, cache_read,
        output_tokens, input_with_cache, input_without_cache, results
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      project_id, token_count, model, finalContextLength, finalContextWindow,
      finalHardware, finalDataCenterProvider, finalDataCenterRegion, finalCustomPue,
      finalCustomCarbonIntensity, calculation_parameters, cache_read ?? null,
      output_tokens ?? null, input_with_cache ?? null, input_without_cache ?? null, results
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
      cache_read,
      output_tokens,
      input_with_cache,
      input_without_cache,
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
        cache_read = COALESCE($11, cache_read),
        output_tokens = COALESCE($12, output_tokens),
        input_with_cache = COALESCE($13, input_with_cache),
        input_without_cache = COALESCE($14, input_without_cache),
        results = COALESCE($15, results),
        updated_at = NOW()
      WHERE id = $16
      RETURNING *
    `, [
      token_count, model, finalContextLength, finalContextWindow,
      finalHardware, finalDataCenterProvider, finalDataCenterRegion, finalCustomPue,
      finalCustomCarbonIntensity, calculation_parameters, cache_read, output_tokens,
      input_with_cache, input_without_cache, results, calculationIdInt
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
    
    // Check if calculation has detailed token breakdown (at least one field is not null/undefined)
    // We check for existence, not just > 0, because 0 is a valid value
    const hasDetailedTokens = (
      (calc.input_with_cache !== null && calc.input_with_cache !== undefined) ||
      (calc.input_without_cache !== null && calc.input_without_cache !== undefined) ||
      (calc.cache_read !== null && calc.cache_read !== undefined) ||
      (calc.output_tokens !== null && calc.output_tokens !== undefined)
    )

    // Calculate total token count (sum of four fields) if detailed breakdown exists
    // token_count should always remain as the sum, not weighted tokens
    let totalTokenCount = calc.token_count
    if (hasDetailedTokens) {
      totalTokenCount = (calc.input_with_cache ?? 0) +
                       (calc.input_without_cache ?? 0) +
                       (calc.cache_read ?? 0) +
                       (calc.output_tokens ?? 0)
    }

    const formData: TokenCalculatorFormData = {
      tokenCount: totalTokenCount, // Use total tokens (sum), core will calculate weighted internally
      model: calc.model,
      contextLength: usePresetContext ? preset.configuration.contextLength : calc.context_length,
      contextWindow: usePresetContext ? preset.configuration.contextWindow : calc.context_window,
      // Always use current preset values for hardware/provider/region when recalculating
      // This ensures consistency with the current preset configuration
      hardware: preset.configuration.hardware,
      dataCenterProvider: preset.configuration.dataCenterProvider,
      dataCenterRegion: preset.configuration.dataCenterRegion,
      // If custom_pue is NULL in DB, use preset value (which may be undefined for region defaults)
      customPue: calc.custom_pue !== null && calc.custom_pue !== undefined 
        ? calc.custom_pue 
        : preset.configuration.customPue,
      // If custom_carbon_intensity is NULL in DB, use preset value (which may be undefined for region defaults)
      customCarbonIntensity: calc.custom_carbon_intensity !== null && calc.custom_carbon_intensity !== undefined
        ? calc.custom_carbon_intensity
        : preset.configuration.customCarbonIntensity,
      // Include detailed token breakdown if available
      useDetailedTokens: hasDetailedTokens,
      inputWithCache: hasDetailedTokens ? (calc.input_with_cache ?? 0) : undefined,
      inputWithoutCache: hasDetailedTokens ? (calc.input_without_cache ?? 0) : undefined,
      cacheRead: hasDetailedTokens ? (calc.cache_read ?? 0) : undefined,
      outputTokens: hasDetailedTokens ? (calc.output_tokens ?? 0) : undefined,
    }

    // Fetch model from database
    const model = await fetchModelFromDB(formData.model)
    if (!model) {
      throw new Error(`Model '${formData.model}' not found`)
    }

    // Recalculate using the calculation engine
    const newResults = sustainableAICalculator.calculateFromFormData(formData, model)

    // Update calculation_parameters to include weighted_tokens if detailed breakdown was used
    // totalTokenCount was already calculated above, reuse it
    let updatedCalculationParameters = calc.calculation_parameters || {}
    if (hasDetailedTokens && newResults.weightedTokens !== undefined) {
      updatedCalculationParameters = {
        ...updatedCalculationParameters,
        weightedTokens: newResults.weightedTokens
      }
    }

    // Update calculation with new results
    // Keep context values as NULL if they were NULL (indicating "use preset")
    // Only update results, not context values (they should remain NULL to indicate preset usage)
    // token_count remains as total (sum), weighted tokens stored in calculation_parameters
    const updatedResult = await pool.query(`
      UPDATE calculations 
      SET 
        token_count = $1,
        calculation_parameters = $2,
        results = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `, [
      totalTokenCount,
      JSON.stringify(updatedCalculationParameters),
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
      
      // Check if calculation has detailed token breakdown (at least one field is not null/undefined)
      // We check for existence, not just > 0, because 0 is a valid value
      const hasDetailedTokens = (
        (calc.input_with_cache !== null && calc.input_with_cache !== undefined) ||
        (calc.input_without_cache !== null && calc.input_without_cache !== undefined) ||
        (calc.cache_read !== null && calc.cache_read !== undefined) ||
        (calc.output_tokens !== null && calc.output_tokens !== undefined)
      )
      
      // Calculate total token count (sum of four fields) if detailed breakdown exists
      // token_count should always remain as the sum, not weighted tokens
      let totalTokenCount = calc.token_count
      if (hasDetailedTokens) {
        totalTokenCount = (calc.input_with_cache ?? 0) +
                         (calc.input_without_cache ?? 0) +
                         (calc.cache_read ?? 0) +
                         (calc.output_tokens ?? 0)
      }
      
      const formData: TokenCalculatorFormData = {
        tokenCount: totalTokenCount, // Use total tokens (sum), core will calculate weighted internally
        model: calc.model,
        contextLength: usePresetContext ? preset.configuration.contextLength : calc.context_length,
        contextWindow: usePresetContext ? preset.configuration.contextWindow : calc.context_window,
        // Always use current preset values for hardware/provider/region when recalculating
        // This ensures consistency with the current preset configuration
        hardware: preset.configuration.hardware,
        dataCenterProvider: preset.configuration.dataCenterProvider,
        dataCenterRegion: preset.configuration.dataCenterRegion,
        // If custom_pue is NULL in DB, use preset value (which may be undefined for region defaults)
        customPue: calc.custom_pue !== null && calc.custom_pue !== undefined 
          ? calc.custom_pue 
          : preset.configuration.customPue,
        // If custom_carbon_intensity is NULL in DB, use preset value (which may be undefined for region defaults)
        customCarbonIntensity: calc.custom_carbon_intensity !== null && calc.custom_carbon_intensity !== undefined
          ? calc.custom_carbon_intensity
          : preset.configuration.customCarbonIntensity,
        // Include detailed token breakdown if available
        useDetailedTokens: hasDetailedTokens,
        inputWithCache: hasDetailedTokens ? (calc.input_with_cache ?? 0) : undefined,
        inputWithoutCache: hasDetailedTokens ? (calc.input_without_cache ?? 0) : undefined,
        cacheRead: hasDetailedTokens ? (calc.cache_read ?? 0) : undefined,
        outputTokens: hasDetailedTokens ? (calc.output_tokens ?? 0) : undefined,
      }

      // Fetch model from database
      const model = await fetchModelFromDB(formData.model)
      if (!model) {
        throw new Error(`Model '${formData.model}' not found`)
      }

      // Recalculate using the calculation engine
      const newResults = sustainableAICalculator.calculateFromFormData(formData, model)

      // Update calculation_parameters to include weighted_tokens if detailed breakdown was used
      // totalTokenCount was already calculated above, reuse it
      let updatedCalculationParameters = calc.calculation_parameters || {}
      if (hasDetailedTokens && newResults.weightedTokens !== undefined) {
        updatedCalculationParameters = {
          ...updatedCalculationParameters,
          weightedTokens: newResults.weightedTokens
        }
      }

      // Update calculation with new results
      // token_count remains as total (sum), weighted tokens stored in calculation_parameters
      await pool.query(`
        UPDATE calculations 
        SET 
          token_count = $1,
          calculation_parameters = $2,
          results = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [
        totalTokenCount,
        JSON.stringify(updatedCalculationParameters),
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
