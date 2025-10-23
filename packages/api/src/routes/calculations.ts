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

// Get calculations for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { user_id, limit = 50, offset = 0 } = req.query

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
        created_at,
        updated_at
      FROM calculations 
      WHERE project_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [projectId, limit, offset])

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM calculations WHERE project_id = $1
    `, [projectId])

    res.json({ 
      success: true, 
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error) {
    console.error('Error fetching calculations:', error)
    res.status(500).json({ error: 'Failed to fetch calculations' })
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
      custom_carbon_intensity, calculation_parameters, results, id
    ])

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating calculation:', error)
    res.status(500).json({ error: 'Failed to update calculation' })
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
