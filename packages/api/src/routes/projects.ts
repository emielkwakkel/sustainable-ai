import { Router } from 'express'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const router = Router()

// Database connection - use SQLite for development if PostgreSQL is not available
let pool: Pool
let useSQLite = false

try {
  // Try PostgreSQL first
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'sustainable_ai_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  })
  
  // Test connection
  pool.query('SELECT 1').catch(() => {
    console.log('PostgreSQL not available, using SQLite for development')
    useSQLite = true
  })
} catch (error) {
  console.log('PostgreSQL not available, using SQLite for development')
  useSQLite = true
}

// Simple in-memory storage for development
const projects: any[] = []
let nextId = 1

// SQLite-like query function
const query = async (sql: string, params: any[] = []) => {
  if (useSQLite) {
    // Simple in-memory implementation for development
    if (sql.includes('SELECT EXISTS')) {
      return { rows: [{ exists: true }] }
    }
    if (sql.includes('SELECT') && sql.includes('FROM projects')) {
      return { rows: projects }
    }
    if (sql.includes('INSERT INTO projects')) {
      const newProject = {
        id: nextId++,
        name: params[0],
        description: params[1],
        calculation_preset_id: params[2],
        user_id: params[3],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      projects.push(newProject)
      return { rows: [newProject] }
    }
    if (sql.includes('UPDATE projects')) {
      const id = params[3]
      const project = projects.find(p => p.id == id)
      if (project) {
        if (params[0]) project.name = params[0]
        if (params[1]) project.description = params[1]
        if (params[2]) project.calculation_preset_id = params[2]
        project.updated_at = new Date().toISOString()
        return { rows: [project] }
      }
      return { rows: [] }
    }
    if (sql.includes('DELETE FROM projects')) {
      const id = params[0]
      const index = projects.findIndex(p => p.id == id)
      if (index !== -1) {
        projects.splice(index, 1)
        return { rows: [{ id }] }
      }
      return { rows: [] }
    }
    return { rows: [] }
  } else {
    return await pool.query(sql, params)
  }
}

// Get all projects for a user
router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // First check if projects table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('Projects table does not exist, returning empty array')
      return res.json({ success: true, data: [] })
    }

    const result = await query(`
      SELECT 
        p.*,
        COUNT(c.id) as calculation_count,
        COALESCE(SUM((c.results->>'totalEmissionsGrams')::DECIMAL), 0) as total_emissions_grams,
        COALESCE(SUM((c.results->>'energyJoules')::DECIMAL), 0) as total_energy_joules
      FROM projects p
      LEFT JOIN calculations c ON p.id = c.project_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [user_id])

    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

// Get a specific project with calculations
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Get project details
    const projectResult = await query(`
      SELECT * FROM projects 
      WHERE id = $1 AND user_id = $2
    `, [id, user_id])

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Get project analytics
    let analyticsResult
    if (useSQLite) {
      // SQLite fallback - calculate analytics manually
      const analyticsData = await query(`
        SELECT 
          COUNT(*) as calculationCount,
          MIN(created_at) as startDate,
          MAX(created_at) as endDate
        FROM calculations 
        WHERE project_id = ?
      `, [id])
      
      analyticsResult = {
        rows: [{
          totalEmissionsGrams: 0,
          totalEnergyJoules: 0,
          averageEmissionsPerToken: 0,
          calculationCount: analyticsData.rows[0]?.calculationCount || 0,
          dateRange: {
            start: analyticsData.rows[0]?.startDate,
            end: analyticsData.rows[0]?.endDate
          }
        }]
      }
    } else {
      // PostgreSQL - use the function
      analyticsResult = await query(`
        SELECT * FROM get_project_analytics($1)
      `, [id])
    }

    // Get recent calculations
    const calculationsResult = await query(`
      SELECT 
        id,
        token_count,
        model,
        results,
        created_at
      FROM calculations 
      WHERE project_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [id])

    res.json({
      success: true,
      data: {
        project: projectResult.rows[0],
        analytics: analyticsResult.rows[0].get_project_analytics,
        recentCalculations: calculationsResult.rows
      }
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    res.status(500).json({ error: 'Failed to fetch project' })
  }
})

// Create a new project
router.post('/', async (req, res) => {
  try {
    console.log('Creating project with body:', req.body)
    const { name, description, calculation_preset_id, user_id } = req.body

    if (!name || !calculation_preset_id || !user_id) {
      console.log('Missing required fields:', { name, calculation_preset_id, user_id })
      return res.status(400).json({ 
        error: 'name, calculation_preset_id, and user_id are required' 
      })
    }

    // First check if projects table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.log('Projects table does not exist')
      return res.status(500).json({ 
        error: 'Database not initialized. Please run database setup first.' 
      })
    }

    const result = await query(`
      INSERT INTO projects (name, description, calculation_preset_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, description, calculation_preset_id, user_id])

    console.log('Project created successfully:', result.rows[0])
    res.status(201).json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating project:', error)
    res.status(500).json({ error: 'Failed to create project' })
  }
})

// Update a project
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, calculation_preset_id, user_id } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    const result = await query(`
      UPDATE projects 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          calculation_preset_id = COALESCE($3, calculation_preset_id),
          updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [name, description, calculation_preset_id, id, user_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error updating project:', error)
    res.status(500).json({ error: 'Failed to update project' })
  }
})

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    const result = await query(`
      DELETE FROM projects 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, user_id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({ success: true, message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

// Get project emissions timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id, start_date, end_date, interval = 'day' } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Verify project belongs to user
    const projectCheck = await query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const result = await query(`
      SELECT * FROM get_project_emissions_timeline($1, $2, $3, $4)
    `, [id, start_date, end_date, interval])

    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching project timeline:', error)
    res.status(500).json({ error: 'Failed to fetch project timeline' })
  }
})

// Recalculate project emissions
router.post('/:id/recalculate', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id, algorithm_version } = req.body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Verify project belongs to user
    const projectCheck = await query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [id, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const result = await query(`
      SELECT recalculate_project_emissions($1, $2) as updated_count
    `, [id, algorithm_version || '1.0.0'])

    res.json({ 
      success: true, 
      data: { 
        updatedCount: result.rows[0].updated_count,
        algorithmVersion: algorithm_version || '1.0.0'
      }
    })
  } catch (error) {
    console.error('Error recalculating project:', error)
    res.status(500).json({ error: 'Failed to recalculate project' })
  }
})

export default router
