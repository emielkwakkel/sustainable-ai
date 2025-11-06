import { Router } from 'express'
import { Pool } from 'pg'
import { countTokens, calculateCost, calculateRoundInputTokens } from '@susai/core'
import type {
  Chat,
  Agent,
  Round,
  AgentResponse,
  ChatWithDetails,
  ChatSummary,
  CreateChatRequest,
  UpdateChatRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateRoundRequest,
  UpdateRoundRequest,
  TokenCountResult,
} from '@susai/types'

const router = Router()

// PostgreSQL database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sustainable_ai_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
})

// ===== CHAT ROUTES =====

// Get all chats for a user
router.get('/chats', async (req, res) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (typeof user_id !== 'string' || !uuidRegex.test(user_id)) {
      return res.status(400).json({ success: false, error: 'user_id must be a valid UUID' })
    }

    const result = await pool.query(
      `SELECT c.*, 
        cs.total_input_tokens, cs.total_output_tokens, cs.total_tokens,
        cs.gpt35_total_cost, cs.gpt4o_total_cost
      FROM chats c
      LEFT JOIN chat_summaries cs ON c.id = cs.chat_id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC`,
      [user_id]
    )

    res.json({ success: true, data: result.rows })
  } catch (error: any) {
    console.error('Error fetching chats:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get a single chat with all details
router.get('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Get chat
    const chatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [id])
    if (chatResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat not found' })
    }

    const chat: Chat = chatResult.rows[0]

    // Get agents
    const agentsResult = await pool.query(
      'SELECT * FROM agents WHERE chat_id = $1 ORDER BY display_order, created_at',
      [id]
    )
    const agents: Agent[] = agentsResult.rows

    // Get rounds with responses
    const roundsResult = await pool.query(
      `SELECT r.*, 
        json_agg(
          json_build_object(
            'id', ar.id,
            'agent_id', ar.agent_id,
            'agent', json_build_object(
              'id', a.id,
              'name', a.name,
              'display_order', a.display_order
            ),
            'response_text', ar.response_text,
            'token_count', ar.token_count,
            'created_at', ar.created_at,
            'updated_at', ar.updated_at
          )
        ) FILTER (WHERE ar.id IS NOT NULL) as responses
      FROM rounds r
      LEFT JOIN agent_responses ar ON r.id = ar.round_id
      LEFT JOIN agents a ON ar.agent_id = a.id
      WHERE r.chat_id = $1
      GROUP BY r.id
      ORDER BY r.round_number`,
      [id]
    )

    const rounds = roundsResult.rows.map((row: any) => ({
      ...row,
      responses: row.responses || []
    }))

    // Get summary
    const summaryResult = await pool.query(
      'SELECT * FROM chat_summaries WHERE chat_id = $1',
      [id]
    )
    const summary: ChatSummary | undefined = summaryResult.rows[0]

    const chatWithDetails: ChatWithDetails = {
      ...chat,
      agents,
      rounds,
      summary
    }

    res.json({ success: true, data: chatWithDetails })
  } catch (error: any) {
    console.error('Error fetching chat:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Create a new chat
router.post('/chats', async (req, res) => {
  try {
    const { name, user_id }: CreateChatRequest = req.body

    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (typeof user_id !== 'string' || !uuidRegex.test(user_id)) {
      return res.status(400).json({ success: false, error: 'user_id must be a valid UUID' })
    }

    const chatName = name || `Chat ${new Date().toISOString().split('T')[0]}`

    const result = await pool.query(
      'INSERT INTO chats (name, user_id) VALUES ($1, $2) RETURNING *',
      [chatName, user_id]
    )

    const chat: Chat = result.rows[0]

    // Create default agent
    const agentResult = await pool.query(
      'INSERT INTO agents (chat_id, name, display_order) VALUES ($1, $2, $3) RETURNING *',
      [chat.id, 'Agent 1', 0]
    )

    res.json({ success: true, data: { ...chat, agents: [agentResult.rows[0]] } })
  } catch (error: any) {
    console.error('Error creating chat:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update a chat
router.put('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name }: UpdateChatRequest = req.body

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await pool.query(
      `UPDATE chats SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error updating chat:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete a chat
router.delete('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query('DELETE FROM chats WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error deleting chat:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===== AGENT ROUTES =====

// Create an agent
router.post('/chats/:chatId/agents', async (req, res) => {
  try {
    const { chatId } = req.params
    const { name }: CreateAgentRequest = req.body

    // Get current max display_order
    const maxOrderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), -1) + 1 as next_order FROM agents WHERE chat_id = $1',
      [chatId]
    )
    const nextOrder = maxOrderResult.rows[0].next_order

    const agentName = name || `Agent ${nextOrder + 1}`

    const result = await pool.query(
      'INSERT INTO agents (chat_id, name, display_order) VALUES ($1, $2, $3) RETURNING *',
      [chatId, agentName, nextOrder]
    )

    // Recalculate all rounds' actual_input_tokens since agent count changed
    const agentsResult = await pool.query('SELECT COUNT(*) as count FROM agents WHERE chat_id = $1', [chatId])
    const agentCount = parseInt(agentsResult.rows[0].count) || 1

    const allRoundsResult = await pool.query(
      `SELECT r.id, r.round_number, r.prompt
      FROM rounds r
      WHERE r.chat_id = $1
      ORDER BY r.round_number`,
      [chatId]
    )

    for (const round of allRoundsResult.rows) {
      const previousRoundsResult = await pool.query(
        `SELECT r.*, 
          json_agg(
            json_build_object(
              'id', ar.id,
              'round_id', ar.round_id,
              'agent_id', ar.agent_id,
              'response_text', ar.response_text,
              'token_count', ar.token_count
            )
          ) FILTER (WHERE ar.id IS NOT NULL) as responses
        FROM rounds r
        LEFT JOIN agent_responses ar ON r.id = ar.round_id
        WHERE r.chat_id = $1 AND r.round_number < $2
        GROUP BY r.id
        ORDER BY r.round_number`,
        [chatId, round.round_number]
      )

      const previousRounds = previousRoundsResult.rows.map((row: any) => ({
        ...row,
        responses: row.responses || []
      }))

      const actualInputTokens = calculateRoundInputTokens(
        round.round_number,
        round.prompt || '',
        previousRounds,
        agentCount,
        'gpt-4'
      )

      await pool.query(
        'UPDATE rounds SET actual_input_tokens = $1 WHERE id = $2',
        [actualInputTokens, round.id]
      )
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update an agent
router.put('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, display_order }: UpdateAgentRequest = req.body

    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(name)
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`)
      values.push(display_order)
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' })
    }

    values.push(id)

    const result = await pool.query(
      `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error updating agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete an agent
router.delete('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if this is the last agent
    const agentResult = await pool.query('SELECT chat_id FROM agents WHERE id = $1', [id])
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' })
    }

    const { chat_id } = agentResult.rows[0]

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM agents WHERE chat_id = $1',
      [chat_id]
    )

    if (parseInt(countResult.rows[0].count) <= 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the last agent. A chat must have at least one agent.'
      })
    }

    const result = await pool.query('DELETE FROM agents WHERE id = $1 RETURNING *', [id])

    // Recalculate all rounds' actual_input_tokens since agent count changed
    const agentsResult = await pool.query('SELECT COUNT(*) as count FROM agents WHERE chat_id = $1', [chat_id])
    const agentCount = parseInt(agentsResult.rows[0].count) || 1

    const allRoundsResult = await pool.query(
      `SELECT r.id, r.round_number, r.prompt
      FROM rounds r
      WHERE r.chat_id = $1
      ORDER BY r.round_number`,
      [chat_id]
    )

    for (const round of allRoundsResult.rows) {
      const previousRoundsResult = await pool.query(
        `SELECT r.*, 
          json_agg(
            json_build_object(
              'id', ar.id,
              'round_id', ar.round_id,
              'agent_id', ar.agent_id,
              'response_text', ar.response_text,
              'token_count', ar.token_count
            )
          ) FILTER (WHERE ar.id IS NOT NULL) as responses
        FROM rounds r
        LEFT JOIN agent_responses ar ON r.id = ar.round_id
        WHERE r.chat_id = $1 AND r.round_number < $2
        GROUP BY r.id
        ORDER BY r.round_number`,
        [chat_id, round.round_number]
      )

      const previousRounds = previousRoundsResult.rows.map((row: any) => ({
        ...row,
        responses: row.responses || []
      }))

      const actualInputTokens = calculateRoundInputTokens(
        round.round_number,
        round.prompt || '',
        previousRounds,
        agentCount,
        'gpt-4'
      )

      await pool.query(
        'UPDATE rounds SET actual_input_tokens = $1 WHERE id = $2',
        [actualInputTokens, round.id]
      )
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error deleting agent:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===== ROUND ROUTES =====

// Create a round
router.post('/chats/:chatId/rounds', async (req, res) => {
  try {
    const { chatId } = req.params
    const { prompt = '', responses = [] }: CreateRoundRequest = req.body

    // Get next round number
    const roundResult = await pool.query(
      'SELECT COALESCE(MAX(round_number), 0) + 1 as next_round FROM rounds WHERE chat_id = $1',
      [chatId]
    )
    const roundNumber = roundResult.rows[0].next_round

    // Calculate prompt tokens (empty prompt = 0 tokens)
    const promptTokens = prompt ? countTokens(prompt, 'gpt-4') : 0

    // Get agent count and previous rounds for multi-agent input calculation
    const agentsResult = await pool.query('SELECT COUNT(*) as count FROM agents WHERE chat_id = $1', [chatId])
    const agentCount = parseInt(agentsResult.rows[0].count) || 1

    const previousRoundsResult = await pool.query(
      `SELECT r.*, 
        json_agg(
          json_build_object(
            'id', ar.id,
            'round_id', ar.round_id,
            'agent_id', ar.agent_id,
            'response_text', ar.response_text,
            'token_count', ar.token_count
          )
        ) FILTER (WHERE ar.id IS NOT NULL) as responses
      FROM rounds r
      LEFT JOIN agent_responses ar ON r.id = ar.round_id
      WHERE r.chat_id = $1 AND r.round_number < $2
      GROUP BY r.id
      ORDER BY r.round_number`,
      [chatId, roundNumber]
    )

    const previousRounds = previousRoundsResult.rows.map((row: any) => ({
      ...row,
      responses: row.responses || []
    }))

    // Calculate actual input tokens (accounting for multi-agent accumulation)
    const actualInputTokens = calculateRoundInputTokens(
      roundNumber,
      prompt,
      previousRounds,
      agentCount,
      'gpt-4'
    )

    // Insert round
    const roundInsertResult = await pool.query(
      'INSERT INTO rounds (chat_id, round_number, prompt, prompt_tokens, actual_input_tokens) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [chatId, roundNumber, prompt, promptTokens, actualInputTokens]
    )

    const round: Round = roundInsertResult.rows[0]

    // Insert agent responses
    const agentResponses: AgentResponse[] = []
    if (responses && responses.length > 0) {
      for (const response of responses) {
        const responseTokens = countTokens(response.response_text, 'gpt-4')
        const responseResult = await pool.query(
          'INSERT INTO agent_responses (round_id, agent_id, response_text, token_count) VALUES ($1, $2, $3, $4) RETURNING *',
          [round.id, response.agent_id, response.response_text, responseTokens]
        )
        agentResponses.push(responseResult.rows[0])
      }
    }

    res.json({
      success: true,
      data: {
        ...round,
        responses: agentResponses
      }
    })
  } catch (error: any) {
    console.error('Error creating round:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Update a round
router.put('/chats/:chatId/rounds/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params
    const { prompt, responses }: UpdateRoundRequest = req.body

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Get round info for recalculation
      const roundInfoResult = await client.query('SELECT chat_id, round_number FROM rounds WHERE id = $1', [roundId])
      if (roundInfoResult.rows.length === 0) {
        throw new Error('Round not found')
      }
      const { chat_id, round_number } = roundInfoResult.rows[0]

      // Update prompt if provided
      if (prompt !== undefined) {
        const promptTokens = prompt ? countTokens(prompt, 'gpt-4') : 0
        
        // Recalculate actual input tokens if prompt changed
        const agentsResult = await client.query('SELECT COUNT(*) as count FROM agents WHERE chat_id = $1', [chat_id])
        const agentCount = parseInt(agentsResult.rows[0].count) || 1

        const previousRoundsResult = await client.query(
          `SELECT r.*, 
            json_agg(
              json_build_object(
                'id', ar.id,
                'round_id', ar.round_id,
                'agent_id', ar.agent_id,
                'response_text', ar.response_text,
                'token_count', ar.token_count
              )
            ) FILTER (WHERE ar.id IS NOT NULL) as responses
          FROM rounds r
          LEFT JOIN agent_responses ar ON r.id = ar.round_id
          WHERE r.chat_id = $1 AND r.round_number < $2
          GROUP BY r.id
          ORDER BY r.round_number`,
          [chat_id, round_number]
        )

        const previousRounds = previousRoundsResult.rows.map((row: any) => ({
          ...row,
          responses: row.responses || []
        }))

        const actualInputTokens = calculateRoundInputTokens(
          round_number,
          prompt || '',
          previousRounds,
          agentCount,
          'gpt-4'
        )

        await client.query(
          'UPDATE rounds SET prompt = $1, prompt_tokens = $2, actual_input_tokens = $3, updated_at = NOW() WHERE id = $4',
          [prompt || '', promptTokens, actualInputTokens, roundId]
        )
      }

      // Update responses if provided
      if (responses !== undefined) {
        // Delete all existing responses for this round
        await client.query('DELETE FROM agent_responses WHERE round_id = $1', [roundId])

        // Insert new responses (using ON CONFLICT in case of duplicates in the array)
        for (const response of responses) {
          if (response.agent_id && response.response_text !== undefined) {
            const responseTokens = countTokens(response.response_text, 'gpt-4')
            await client.query(
              `INSERT INTO agent_responses (round_id, agent_id, response_text, token_count, updated_at)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT (round_id, agent_id) 
               DO UPDATE SET 
                 response_text = EXCLUDED.response_text,
                 token_count = EXCLUDED.token_count,
                 updated_at = NOW()`,
              [roundId, response.agent_id, response.response_text, responseTokens]
            )
          }
        }

        // Recalculate actual_input_tokens for all subsequent rounds (since responses changed)
        const agentsResult = await client.query('SELECT COUNT(*) as count FROM agents WHERE chat_id = $1', [chat_id])
        const agentCount = parseInt(agentsResult.rows[0].count) || 1

        const subsequentRoundsResult = await client.query(
          `SELECT r.id, r.round_number, r.prompt
          FROM rounds r
          WHERE r.chat_id = $1 AND r.round_number > $2
          ORDER BY r.round_number`,
          [chat_id, round_number]
        )

        for (const subsequentRound of subsequentRoundsResult.rows) {
          const previousRoundsResult = await client.query(
            `SELECT r.*, 
              json_agg(
                json_build_object(
                  'id', ar.id,
                  'round_id', ar.round_id,
                  'agent_id', ar.agent_id,
                  'response_text', ar.response_text,
                  'token_count', ar.token_count
                )
              ) FILTER (WHERE ar.id IS NOT NULL) as responses
            FROM rounds r
            LEFT JOIN agent_responses ar ON r.id = ar.round_id
            WHERE r.chat_id = $1 AND r.round_number < $2
            GROUP BY r.id
            ORDER BY r.round_number`,
            [chat_id, subsequentRound.round_number]
          )

          const previousRounds = previousRoundsResult.rows.map((row: any) => ({
            ...row,
            responses: row.responses || []
          }))

          const actualInputTokens = calculateRoundInputTokens(
            subsequentRound.round_number,
            subsequentRound.prompt || '',
            previousRounds,
            agentCount,
            'gpt-4'
          )

          await client.query(
            'UPDATE rounds SET actual_input_tokens = $1 WHERE id = $2',
            [actualInputTokens, subsequentRound.id]
          )
        }
      }

      await client.query('COMMIT')

      // Fetch updated round
      const roundResult = await client.query('SELECT * FROM rounds WHERE id = $1', [roundId])
      const responsesResult = await client.query(
        'SELECT * FROM agent_responses WHERE round_id = $1',
        [roundId]
      )

      res.json({
        success: true,
        data: {
          ...roundResult.rows[0],
          responses: responsesResult.rows
        }
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error: any) {
    console.error('Error updating round:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Delete a round
router.delete('/chats/:chatId/rounds/:roundId', async (req, res) => {
  try {
    const { roundId } = req.params

    const result = await pool.query('DELETE FROM rounds WHERE id = $1 RETURNING *', [roundId])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Round not found' })
    }

    res.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error deleting round:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ===== TOKEN COUNTING ROUTES =====

// Count tokens in text
router.post('/tokenizer/count', async (req, res) => {
  try {
    const { text, model = 'gpt-4' }: { text: string; model?: string } = req.body

    if (!text) {
      return res.status(400).json({ success: false, error: 'text is required' })
    }

    const tokenCount = countTokens(text, model as any)

    const result: TokenCountResult = {
      count: tokenCount,
      model
    }

    res.json({ success: true, data: result })
  } catch (error: any) {
    console.error('Error counting tokens:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Calculate costs
router.post('/costs/calculate', async (req, res) => {
  try {
    const {
      inputTokens,
      outputTokens,
      model = 'gpt-4o'
    }: {
      inputTokens: number
      outputTokens: number
      model?: 'gpt-3.5-turbo' | 'gpt-4o'
    } = req.body

    if (inputTokens === undefined || outputTokens === undefined) {
      return res.status(400).json({
        success: false,
        error: 'inputTokens and outputTokens are required'
      })
    }

    const cost = calculateCost(inputTokens, outputTokens, model)

    res.json({ success: true, data: cost })
  } catch (error: any) {
    console.error('Error calculating costs:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

export { router as tokenSimulatorRoutes }

