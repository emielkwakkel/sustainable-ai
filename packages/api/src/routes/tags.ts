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

// Get all tags for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      })
    }

    const projectIdInt = parseInt(projectId, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [projectIdInt, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    const result = await pool.query(`
      SELECT id, name, color, created_at, updated_at
      FROM tags
      WHERE project_id = $1
      ORDER BY name
    `, [projectIdInt])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    })
  }
})

// Create a new tag
router.post('/', async (req, res) => {
  try {
    const { project_id, name, color, user_id } = req.body

    if (!project_id || !name || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'project_id, name, and user_id are required'
      })
    }

    const projectIdInt = parseInt(project_id, 10)
    if (isNaN(projectIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      })
    }

    // Verify project belongs to user
    const projectCheck = await pool.query(`
      SELECT id FROM projects WHERE id = $1 AND user_id = $2
    `, [projectIdInt, user_id])

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      })
    }

    const result = await pool.query(`
      INSERT INTO tags (project_id, name, color)
      VALUES ($1, $2, $3)
      ON CONFLICT (project_id, name) DO UPDATE SET color = $3
      RETURNING *
    `, [projectIdInt, name, color || '#3b82f6'])

    res.status(201).json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error creating tag:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create tag'
    })
  }
})

// Assign tags to calculations
router.post('/assign', async (req, res) => {
  try {
    const { calculation_ids, tag_ids, user_id } = req.body

    if (!calculation_ids || !Array.isArray(calculation_ids) || calculation_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'calculation_ids array is required'
      })
    }

    if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tag_ids array is required'
      })
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      })
    }

    await pool.query('BEGIN')

    try {
      // Verify all calculations belong to user's projects
      const calcCheck = await pool.query(`
        SELECT c.id
        FROM calculations c
        JOIN projects p ON c.project_id = p.id
        WHERE c.id = ANY($1::INTEGER[]) AND p.user_id = $2
      `, [calculation_ids, user_id])

      if (calcCheck.rows.length !== calculation_ids.length) {
        await pool.query('ROLLBACK')
        return res.status(403).json({
          success: false,
          error: 'Some calculations not found or access denied'
        })
      }

      // Remove existing tags for these calculations
      await pool.query(`
        DELETE FROM calculation_tags
        WHERE calculation_id = ANY($1::INTEGER[])
      `, [calculation_ids])

      // Insert new tag assignments
      const insertValues = []
      for (const calcId of calculation_ids) {
        for (const tagId of tag_ids) {
          insertValues.push(`(${calcId}, ${tagId})`)
        }
      }

      if (insertValues.length > 0) {
        await pool.query(`
          INSERT INTO calculation_tags (calculation_id, tag_id)
          VALUES ${insertValues.join(', ')}
          ON CONFLICT DO NOTHING
        `)
      }

      await pool.query('COMMIT')

      res.json({
        success: true,
        message: 'Tags assigned successfully'
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('Error assigning tags:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to assign tags'
    })
  }
})

// Delete a tag
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

    const tagIdInt = parseInt(id, 10)
    if (isNaN(tagIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tag ID'
      })
    }

    // Verify tag belongs to user's project
    const tagCheck = await pool.query(`
      SELECT t.id
      FROM tags t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND p.user_id = $2
    `, [tagIdInt, user_id])

    if (tagCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      })
    }

    // Delete tag (cascade will remove calculation_tags)
    await pool.query(`
      DELETE FROM tags WHERE id = $1
    `, [tagIdInt])

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete tag'
    })
  }
})

export default router

