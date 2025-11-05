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
        whereConditions.push(`c.id IN (
          SELECT DISTINCT calculation_id 
          FROM calculation_tags 
          WHERE tag_id = ANY($${paramIndex}::INTEGER[])
        )`)
        queryParams.push(tagIdsArray)
        paramIndex++
      }
    }

    const whereClause = whereConditions.join(' AND ')

    // Get calculations with tags
    const result = await pool.query(`
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
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...queryParams, parseInt(limit as string), parseInt(offset as string)])

    // Get total count with same filters (without tag_ids in queryParams since it's already there)
    const countParams = [...queryParams]
    const countWhereConditions = ['c.project_id = $1']
    let countParamIndex = 2
    
    if (start_date) {
      countWhereConditions.push(`c.created_at >= $${countParamIndex}`)
      countParamIndex++
    }
    
    if (end_date) {
      countWhereConditions.push(`c.created_at <= $${countParamIndex}`)
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
        countQuery += `
          INNER JOIN calculation_tags ct ON c.id = ct.calculation_id
          WHERE ${countWhereConditions.join(' AND ')} AND ct.tag_id = ANY($${countParamIndex}::INTEGER[])
        `
        countParams.push(tagIdsArray)
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

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [project_id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const result = await pool.query(`
      INSERT INTO calculations (
        project_id, token_count, model, context_length, context_window,
        hardware, data_center_provider, data_center_region, custom_pue,
        custom_carbon_intensity, calculation_parameters, results
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      project_id, token_count, model, context_length, context_window,
      hardware, data_center_provider, data_center_region, custom_pue,
      custom_carbon_intensity, calculation_parameters, results
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

    // Verify calculation belongs to user's project
    const calculationCheck = await pool.query(`
      SELECT c.id FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [calculationIdInt, user_id])

    if (calculationCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Calculation not found' 
      })
    }

    const result = await pool.query(`
      UPDATE calculations 
      SET 
        token_count = COALESCE($1, token_count),
        model = COALESCE($2, model),
        context_length = COALESCE($3, context_length),
        context_window = COALESCE($4, context_window),
        hardware = COALESCE($5, hardware),
        data_center_provider = COALESCE($6, data_center_provider),
        data_center_region = COALESCE($7, data_center_region),
        custom_pue = COALESCE($8, custom_pue),
        custom_carbon_intensity = COALESCE($9, custom_carbon_intensity),
        calculation_parameters = COALESCE($10, calculation_parameters),
        results = COALESCE($11, results),
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      token_count, model, context_length, context_window,
      hardware, data_center_provider, data_center_region, custom_pue,
      custom_carbon_intensity, calculation_parameters, results, calculationIdInt
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

    // Get calculation with project info
    const calcResult = await pool.query(`
      SELECT c.*, p.calculation_preset_id
      FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = $1 AND p.user_id = $2
    `, [id, user_id])

    if (calcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Calculation not found' })
    }

    const calc = calcResult.rows[0]

    // Recalculate using the calculation API logic
    // For now, we'll use the existing results structure
    // In a full implementation, you'd call the calculation API here
    const updatedResult = await pool.query(`
      UPDATE calculations 
      SET 
        updated_at = NOW(),
        results = jsonb_set(results, '{recalculatedAt}', to_jsonb(NOW()::text))
      WHERE id = $1
      RETURNING *
    `, [id])

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

    // Verify all calculations belong to user's projects
    const checkResult = await pool.query(`
      SELECT c.id FROM calculations c
      JOIN projects p ON c.project_id = p.id
      WHERE c.id = ANY($1::INTEGER[]) AND p.user_id = $2
    `, [calculation_ids, user_id])

    if (checkResult.rows.length !== calculation_ids.length) {
      return res.status(400).json({ error: 'Some calculations not found or access denied' })
    }

    // Recalculate all
    const updatedResult = await pool.query(`
      UPDATE calculations 
      SET 
        updated_at = NOW(),
        results = jsonb_set(results, '{recalculatedAt}', to_jsonb(NOW()::text))
      WHERE id = ANY($1::INTEGER[])
      RETURNING id
    `, [calculation_ids])

    res.json({ 
      success: true, 
      data: { 
        updatedCount: updatedResult.rows.length,
        calculationIds: updatedResult.rows.map(r => r.id)
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
