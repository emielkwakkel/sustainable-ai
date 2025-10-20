import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'
import { calculationRoutes } from './routes/calculation'
import { configRoutes } from './routes/config'
import { healthRoutes } from './routes/health'

// Load environment variables
dotenv.config()

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
  app.listen(PORT, () => {
    console.log(`🚀 Sustainable AI API server running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
    console.log(`🧮 Calculation API: http://localhost:${PORT}/api/calculation`)
    console.log(`⚙️  Config API: http://localhost:${PORT}/api/config`)
  })
}

export default app
