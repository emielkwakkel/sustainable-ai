import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { calculationRoutes } from './routes/calculation'
import { configRoutes } from './routes/config'
import { healthRoutes } from './routes/health'
import { watttimeRoutes } from './routes/watttime'
import projectsRoutes from './routes/projects'
import calculationsRoutes from './routes/calculations'
import cursorImportRoutes from './routes/cursor-import'
import csvImportRoutes from './routes/csv-import'
import { tokenSimulatorRoutes } from './routes/token-simulator'
import tagsRoutes from './routes/tags'
import modelsRoutes from './routes/models'
import presetsRoutes from './routes/presets'

// Load environment variables
dotenv.config()

// Disable SSL certificate verification for development
// This allows the API to make requests to external services without SSL issues
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/calculation', calculationRoutes)
app.use('/api/config', configRoutes)
app.use('/api/watttime', watttimeRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/calculations', calculationsRoutes)
app.use('/api/cursor-import', cursorImportRoutes)
app.use('/api/csv-import', csvImportRoutes)
app.use('/api/token-simulator', tokenSimulatorRoutes)
app.use('/api/tags', tagsRoutes)
app.use('/api/models', modelsRoutes)
app.use('/api/presets', presetsRoutes)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server
if (require.main === module) {
  // Try to load SSL certificates for HTTPS
  const certPath = path.join(__dirname, '../../../certs')
  const keyPath = path.join(certPath, 'localhost-key.pem')
  const certPath_file = path.join(certPath, 'localhost-cert.pem')
  
  let server: any
  
  try {
    // Check if SSL certificates exist
    if (fs.existsSync(keyPath) && fs.existsSync(certPath_file)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath_file)
      }
      
      server = https.createServer(options, app)
      server.listen(PORT, () => {
        console.log(`🚀 Sustainable AI API server running on HTTPS port ${PORT}`)
        console.log(`📊 Health check: https://localhost:${PORT}/api/health`)
        console.log(`🧮 Calculation API: https://localhost:${PORT}/api/calculation`)
        console.log(`⚙️  Config API: https://localhost:${PORT}/api/config`)
        console.log(`🌍 WattTime API: https://localhost:${PORT}/api/watttime`)
        console.log(`💬 Token Simulator API: https://localhost:${PORT}/api/token-simulator`)
      })
    } else {
      // Fallback to HTTP if no certificates
      console.log('⚠️  SSL certificates not found, running on HTTP')
      server = app.listen(PORT, () => {
        console.log(`🚀 Sustainable AI API server running on HTTP port ${PORT}`)
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
        console.log(`🧮 Calculation API: http://localhost:${PORT}/api/calculation`)
        console.log(`⚙️  Config API: http://localhost:${PORT}/api/config`)
        console.log(`🌍 WattTime API: http://localhost:${PORT}/api/watttime`)
        console.log(`💬 Token Simulator API: http://localhost:${PORT}/api/token-simulator`)
      })
    }
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
  
  // Keep the server alive
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    server?.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
  
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    server?.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
}

export default app
