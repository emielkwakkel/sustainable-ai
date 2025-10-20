import { Router } from 'express'
import { 
  aiModels, 
  hardwareConfigs, 
  dataCenterProviders,
  getAIModelById,
  getHardwareConfigById,
  getDataCenterProviderById,
  getDataCenterRegionById,
  getRegionsForProvider
} from '@susai/config'
import type { ApiResponse } from '@susai/types'

const router = Router()

// GET /api/config/models
router.get('/models', (req, res) => {
  const response: ApiResponse<typeof aiModels> = {
    success: true,
    data: aiModels
  }
  res.json(response)
})

// GET /api/config/models/:id
router.get('/models/:id', (req, res) => {
  const { id } = req.params
  const model = getAIModelById(id)
  
  if (!model) {
    return res.status(404).json({
      success: false,
      error: 'Model not found'
    } as ApiResponse<never>)
  }

  const response: ApiResponse<typeof model> = {
    success: true,
    data: model
  }
  res.json(response)
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
