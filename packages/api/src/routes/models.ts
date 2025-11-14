import { Router } from 'express'
import { Pool } from 'pg'
import type { CreateModelRequest, UpdateModelRequest, ApiResponse, AIModel } from '@susai/types'

const router = Router()

// PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

// Helper function to transform database row to AIModel
function transformModelRow(row: any): AIModel {
  return {
    id: row.id,
    name: row.name,
    parameters: row.parameters,
    contextLength: row.context_length,
    contextWindow: row.context_window,
    complexityFactor: parseFloat(row.complexity_factor),
    tokenWeights: row.token_weights || undefined,
    pricing: row.pricing || undefined,
    isSystem: row.is_system || false
  }
}

// GET /api/models - List all models
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, parameters, context_length, context_window,
        token_weights, complexity_factor, pricing, is_system,
        created_at, updated_at
      FROM ai_models
      ORDER BY name ASC
    `)

    const models = result.rows.map(transformModelRow)
    const response: ApiResponse<AIModel[]> = {
      success: true,
      data: models
    }
    res.json(response)
  } catch (error) {
    console.error('Error fetching models:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models'
    })
  }
})

// GET /api/models/:id - Get model by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(`
      SELECT 
        id, name, parameters, context_length, context_window,
        token_weights, complexity_factor, pricing, is_system,
        created_at, updated_at
      FROM ai_models
      WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      })
    }

    const model = transformModelRow(result.rows[0])
    const response: ApiResponse<AIModel> = {
      success: true,
      data: model
    }
    res.json(response)
  } catch (error) {
    console.error('Error fetching model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch model'
    })
  }
})

// POST /api/models - Create new model
router.post('/', async (req, res) => {
  try {
    const { name, parameters, contextLength, contextWindow, tokenWeights, pricing }: CreateModelRequest = req.body

    // Validation
    if (!name || !parameters || !contextLength || !contextWindow) {
      return res.status(400).json({
        success: false,
        error: 'name, parameters, contextLength, and contextWindow are required'
      })
    }

    if (parameters <= 0 || contextLength <= 0 || contextWindow <= 0) {
      return res.status(400).json({
        success: false,
        error: 'parameters, contextLength, and contextWindow must be positive numbers'
      })
    }

    // Check if model with same name already exists
    const existingCheck = await pool.query(
      'SELECT id FROM ai_models WHERE name = $1',
      [name]
    )

    if (existingCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Model with this name already exists'
      })
    }

    const result = await pool.query(`
      INSERT INTO ai_models (
        name, parameters, context_length, context_window,
        token_weights, pricing, is_system
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, parameters, context_length, context_window,
        token_weights, complexity_factor, pricing, is_system,
        created_at, updated_at
    `, [
      name,
      parameters,
      contextLength,
      contextWindow,
      tokenWeights ? JSON.stringify(tokenWeights) : null,
      pricing ? JSON.stringify(pricing) : null,
      false // User-created models are not system models
    ])

    const model = transformModelRow(result.rows[0])
    const response: ApiResponse<AIModel> = {
      success: true,
      data: model
    }
    res.status(201).json(response)
  } catch (error) {
    console.error('Error creating model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create model'
    })
  }
})

// PUT /api/models/:id - Update model
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, parameters, contextLength, contextWindow, tokenWeights, pricing }: UpdateModelRequest = req.body

    // Check if model exists
    const existingCheck = await pool.query(
      'SELECT id, is_system FROM ai_models WHERE id = $1',
      [id]
    )

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      })
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      // Check if new name conflicts with existing model
      const nameCheck = await pool.query(
        'SELECT id FROM ai_models WHERE name = $1 AND id != $2',
        [name, id]
      )
      if (nameCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Model with this name already exists'
        })
      }
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }

    if (parameters !== undefined) {
      if (parameters <= 0) {
        return res.status(400).json({
          success: false,
          error: 'parameters must be a positive number'
        })
      }
      updates.push(`parameters = $${paramIndex++}`)
      values.push(parameters)
    }

    if (contextLength !== undefined) {
      if (contextLength <= 0) {
        return res.status(400).json({
          success: false,
          error: 'contextLength must be a positive number'
        })
      }
      updates.push(`context_length = $${paramIndex++}`)
      values.push(contextLength)
    }

    if (contextWindow !== undefined) {
      if (contextWindow <= 0) {
        return res.status(400).json({
          success: false,
          error: 'contextWindow must be a positive number'
        })
      }
      updates.push(`context_window = $${paramIndex++}`)
      values.push(contextWindow)
    }

    if (tokenWeights !== undefined) {
      updates.push(`token_weights = $${paramIndex++}`)
      values.push(tokenWeights === null ? null : JSON.stringify(tokenWeights))
    }

    if (pricing !== undefined) {
      updates.push(`pricing = $${paramIndex++}`)
      values.push(pricing === null ? null : JSON.stringify(pricing))
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      })
    }

    values.push(id)
    const result = await pool.query(`
      UPDATE ai_models
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING 
        id, name, parameters, context_length, context_window,
        token_weights, complexity_factor, pricing, is_system,
        created_at, updated_at
    `, values)

    const model = transformModelRow(result.rows[0])
    const response: ApiResponse<AIModel> = {
      success: true,
      data: model
    }
    res.json(response)
  } catch (error) {
    console.error('Error updating model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update model'
    })
  }
})

// DELETE /api/models/:id - Delete model
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if model exists and is a system model
    const existingCheck = await pool.query(
      'SELECT id, is_system FROM ai_models WHERE id = $1',
      [id]
    )

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      })
    }

    if (existingCheck.rows[0].is_system) {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system models'
      })
    }

    await pool.query('DELETE FROM ai_models WHERE id = $1', [id])

    res.json({
      success: true,
      data: { message: 'Model deleted successfully' }
    })
  } catch (error) {
    console.error('Error deleting model:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete model'
    })
  }
})

export default router

