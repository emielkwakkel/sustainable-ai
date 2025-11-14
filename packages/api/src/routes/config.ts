import { Router } from 'express'
import { Pool } from 'pg'
import { 
  hardwareConfigs, 
  dataCenterProviders,
  getHardwareConfigById,
  getDataCenterProviderById,
  getDataCenterRegionById,
  getRegionsForProvider
} from '@susai/config'
import type { ApiResponse, AIModel } from '@susai/types'

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

// GET /api/config/models
router.get('/models', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, parameters, context_length, context_window,
        token_weights, complexity_factor, pricing, is_system
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
      error: 'Failed to fetch models from database'
    } as ApiResponse<never>)
  }
})

// GET /api/config/models/:id
router.get('/models/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if id is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    let result
    if (isUUID) {
      // If it's a UUID, compare directly with id column only
      result = await pool.query(`
        SELECT 
          id, name, parameters, context_length, context_window,
          token_weights, complexity_factor, pricing, is_system
        FROM ai_models
        WHERE id = $1::uuid
      `, [id])
    } else {
      // If it's not a UUID, only compare with name (case-insensitive)
      result = await pool.query(`
        SELECT 
          id, name, parameters, context_length, context_window,
          token_weights, complexity_factor, pricing, is_system
        FROM ai_models
        WHERE LOWER(name) = LOWER($1)
      `, [id])
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      } as ApiResponse<never>)
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
    } as ApiResponse<never>)
  }
})

// GET /api/config/hardware
router.get('/hardware', (req, res) => {
  const response: ApiResponse<typeof hardwareConfigs> = {
    success: true,
    data: hardwareConfigs
  }
  res.json(response)
})

// GET /api/config/hardware/:id
router.get('/hardware/:id', (req, res) => {
  const { id } = req.params
  const hardware = getHardwareConfigById(id)
  
  if (!hardware) {
    return res.status(404).json({
      success: false,
      error: 'Hardware configuration not found'
    } as ApiResponse<never>)
  }

  const response: ApiResponse<typeof hardware> = {
    success: true,
    data: hardware
  }
  res.json(response)
})

// GET /api/config/datacenters
router.get('/datacenters', (req, res) => {
  const response: ApiResponse<typeof dataCenterProviders> = {
    success: true,
    data: dataCenterProviders
  }
  res.json(response)
})

// GET /api/config/datacenters/:id
router.get('/datacenters/:id', (req, res) => {
  const { id } = req.params
  const provider = getDataCenterProviderById(id)
  
  if (!provider) {
    return res.status(404).json({
      success: false,
      error: 'Data center provider not found'
    } as ApiResponse<never>)
  }

  const response: ApiResponse<typeof provider> = {
    success: true,
    data: provider
  }
  res.json(response)
})

// GET /api/config/datacenters/:providerId/regions
router.get('/datacenters/:providerId/regions', (req, res) => {
  const { providerId } = req.params
  const regions = getRegionsForProvider(providerId)
  
  if (regions.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No regions found for provider'
    } as ApiResponse<never>)
  }

  const response: ApiResponse<typeof regions> = {
    success: true,
    data: regions
  }
  res.json(response)
})

// GET /api/config/datacenters/:providerId/regions/:regionId
router.get('/datacenters/:providerId/regions/:regionId', (req, res) => {
  const { providerId, regionId } = req.params
  const region = getDataCenterRegionById(providerId, regionId)
  
  if (!region) {
    return res.status(404).json({
      success: false,
      error: 'Data center region not found'
    } as ApiResponse<never>)
  }

  const response: ApiResponse<typeof region> = {
    success: true,
    data: region
  }
  res.json(response)
})

export { router as configRoutes }
