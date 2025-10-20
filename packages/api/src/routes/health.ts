import { Router } from 'express'
import type { ApiResponse } from '@susai/types'

const router = Router()

interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  environment: string
}

router.get('/', (req, res) => {
  const healthData: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }

  const response: ApiResponse<HealthResponse> = {
    success: true,
    data: healthData
  }

  res.json(response)
})

export { router as healthRoutes }
