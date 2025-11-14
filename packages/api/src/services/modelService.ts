import { Pool } from 'pg'
import type { AIModel } from '@susai/types'

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
    contextWindow: row.context_window || undefined, // Optional, may not exist after migration
    complexityFactor: parseFloat(row.complexity_factor),
    tokenWeights: row.token_weights || undefined,
    pricing: row.pricing || undefined,
    isSystem: row.is_system || false
  }
}

/**
 * Fetch model from database by ID or name
 * Handles both UUID IDs and string names (case-insensitive)
 */
export async function fetchModelFromDB(modelId: string): Promise<AIModel | null> {
  try {
    // Check if modelId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId)
    
    let result
    if (isUUID) {
      // If it's a UUID, compare directly with id column only
      result = await pool.query(`
        SELECT 
          id, name, parameters, context_length,
          token_weights, complexity_factor, pricing, is_system
        FROM ai_models
        WHERE id = $1::uuid
      `, [modelId])
    } else {
      // If it's not a UUID, only compare with name (case-insensitive)
      result = await pool.query(`
        SELECT 
          id, name, parameters, context_length,
          token_weights, complexity_factor, pricing, is_system
        FROM ai_models
        WHERE LOWER(name) = LOWER($1)
      `, [modelId])
    }

    if (result.rows.length === 0) {
      return null
    }

    return transformModelRow(result.rows[0])
  } catch (error) {
    console.error('Error fetching model from database:', error)
    return null
  }
}

