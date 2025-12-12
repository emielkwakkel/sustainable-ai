import { Router } from 'express'
import { Pool } from 'pg'
import type { ApiResponse, TokenCalculatorPreset, TokenCalculatorFormData } from '@susai/types'

const router = Router()

// PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

// Helper function to transform database row to TokenCalculatorPreset
function transformPresetRow(row: any): TokenCalculatorPreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    configuration: row.configuration as TokenCalculatorFormData,
    userId: row.user_id || undefined,
    isSystem: row.user_id === null || row.user_id === undefined, // System presets have no user_id
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  }
}

// GET /api/presets - List all presets
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query

    let query = `
      SELECT 
        id, name, description, configuration, user_id,
        created_at, updated_at
      FROM presets
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (user_id) {
      // Include presets with no owner (user_id IS NULL) and user's presets
      query += ` AND (user_id IS NULL OR user_id = $${paramIndex})`
      params.push(user_id)
      paramIndex++
    }

    query += ` ORDER BY name ASC`

    const result = await pool.query(query, params)

    const presets = result.rows.map(transformPresetRow)
    const response: ApiResponse<TokenCalculatorPreset[]> = {
      success: true,
      data: presets
    }
    res.json(response)
  } catch (error) {
    console.error('Error fetching presets:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch presets'
    })
  }
})

// GET /api/presets/:id - Get preset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        id, name, description, configuration, user_id,
        created_at, updated_at
      FROM presets
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      })
    }

    const preset = transformPresetRow(result.rows[0])
    const response: ApiResponse<TokenCalculatorPreset> = {
      success: true,
      data: preset
    }
    res.json(response)
  } catch (error) {
    console.error('Error fetching preset:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch preset'
    })
  }
})

// POST /api/presets - Create new preset
router.post('/', async (req, res) => {
  try {
    const { name, description, configuration, user_id } = req.body

    // Validation
    if (!name || !configuration || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'name, configuration, and user_id are required'
      })
    }

    // Validate configuration structure
    if (!configuration.model || !configuration.contextWindow) {
      return res.status(400).json({
        success: false,
        error: 'configuration must include model and contextWindow'
      })
    }

    const result = await pool.query(`
      INSERT INTO presets (name, description, configuration, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, name, description, configuration, user_id,
        created_at, updated_at
    `, [
      name,
      description || null,
      JSON.stringify(configuration),
      user_id
    ])

    const preset = transformPresetRow(result.rows[0])
    const response: ApiResponse<TokenCalculatorPreset> = {
      success: true,
      data: preset
    }
    res.status(201).json(response)
  } catch (error) {
    console.error('Error creating preset:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create preset'
    })
  }
})

// PUT /api/presets/:id - Update preset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, configuration, user_id } = req.body

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      })
    }

    // Check if preset exists
    const existingCheck = await pool.query(
      'SELECT id, user_id FROM presets WHERE id = $1',
      [id]
    )

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      })
    }

    const existing = existingCheck.rows[0]

    // System presets (user_id IS NULL) cannot be updated
    if (existing.user_id === null || existing.user_id === undefined) {
      return res.status(403).json({
        success: false,
        error: 'Cannot update system presets'
      })
    }

    // Users can only update their own presets (user_id must match)
    if (existing.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot update presets owned by other users'
      })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`)
      values.push(description === '' ? null : description)
    }

    if (configuration !== undefined) {
      // Validate configuration structure
      if (!configuration.model || !configuration.contextLength || !configuration.contextWindow) {
        return res.status(400).json({
          success: false,
          error: 'configuration must include model, contextLength, and contextWindow'
        })
      }
      updates.push(`configuration = $${paramIndex++}`)
      values.push(JSON.stringify(configuration))
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      })
    }

    values.push(id)
    const result = await pool.query(`
      UPDATE presets
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING 
        id, name, description, configuration, user_id,
        created_at, updated_at
    `, values)

    const preset = transformPresetRow(result.rows[0])
    const response: ApiResponse<TokenCalculatorPreset> = {
      success: true,
      data: preset
    }
    res.json(response)
  } catch (error) {
    console.error('Error updating preset:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update preset'
    })
  }
})

// DELETE /api/presets/:id - Delete preset
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

    // Check if preset exists
    const existingCheck = await pool.query(
      'SELECT id, user_id FROM presets WHERE id = $1',
      [id]
    )

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Preset not found'
      })
    }

    const existing = existingCheck.rows[0]

    // System presets (user_id IS NULL) cannot be deleted
    if (existing.user_id === null || existing.user_id === undefined) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system presets'
      })
    }

    // Users can only delete their own presets (user_id must match)
    if (existing.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete presets owned by other users'
      })
    }

    await pool.query('DELETE FROM presets WHERE id = $1', [id])

    res.json({
      success: true,
      data: { message: 'Preset deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting preset:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete preset'
    })
  }
})

export default router

