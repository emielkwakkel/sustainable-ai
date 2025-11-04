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
  TokenCountResult
} from '@susai/types'
import { countTokens } from '@susai/core'

// Use native fetch to avoid Nuxt type inference issues and Vue Router interception
const fetchApi = async (url: string, options?: any): Promise<any> => {
  if (typeof window !== 'undefined') {
    // Client-side: use native fetch with full URL
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    let fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`
    
    // Handle query parameters
    if (options?.query) {
      const searchParams = new URLSearchParams()
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += `?${queryString}`
      }
    }

    const fetchOptions: RequestInit = {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    }
    
    if (options?.body) {
      fetchOptions.body = JSON.stringify(options.body)
    }
    
    const response = await fetch(fullUrl, fetchOptions)
    return await response.json()
  } else {
    // Server-side: use $fetch if available
    if (typeof $fetch !== 'undefined') {
      return $fetch(url, options)
    }
    throw new Error('$fetch is not available')
  }
}

const API_BASE = '/api/token-simulator'

// Extended Chat type with summary fields for list view
export interface ChatWithSummary extends Chat {
  total_input_tokens?: number
  total_output_tokens?: number
  total_tokens?: number
  gpt35_total_cost?: number
  gpt4o_total_cost?: number
}

export const useTokenSimulator = () => {
  // Get all chats
  const getChats = async (userId: string): Promise<ChatWithSummary[]> => {
    const response = await fetchApi(`${API_BASE}/chats`, {
      query: { user_id: userId }
    })
    if (!response.success) {
      throw new Error('Failed to fetch chats')
    }
    return response.data
  }

  // Get a single chat with details
  const getChat = async (chatId: string): Promise<ChatWithDetails> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}`)
    if (!response.success) {
      throw new Error('Failed to fetch chat')
    }
    return response.data
  }

  // Create a new chat
  const createChat = async (request: CreateChatRequest): Promise<Chat & { agents: Agent[] }> => {
    const response = await fetchApi(`${API_BASE}/chats`, {
      method: 'POST',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to create chat')
    }
    return response.data
  }

  // Update a chat
  const updateChat = async (chatId: string, request: UpdateChatRequest): Promise<Chat> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}`, {
      method: 'PUT',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to update chat')
    }
    return response.data
  }

  // Delete a chat
  const deleteChat = async (chatId: string): Promise<void> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}`, {
      method: 'DELETE'
    })
    if (!response.success) {
      throw new Error('Failed to delete chat')
    }
  }

  // Create an agent
  const createAgent = async (chatId: string, request: CreateAgentRequest): Promise<Agent> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}/agents`, {
      method: 'POST',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to create agent')
    }
    return response.data
  }

  // Update an agent
  const updateAgent = async (agentId: string, request: UpdateAgentRequest): Promise<Agent> => {
    const response = await fetchApi(`${API_BASE}/agents/${agentId}`, {
      method: 'PUT',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to update agent')
    }
    return response.data
  }

  // Delete an agent
  const deleteAgent = async (agentId: string): Promise<void> => {
    const response = await fetchApi(`${API_BASE}/agents/${agentId}`, {
      method: 'DELETE'
    })
    if (!response.success) {
      throw new Error('Failed to delete agent')
    }
  }

  // Create a round
  const createRound = async (chatId: string, request: CreateRoundRequest): Promise<Round & { responses: AgentResponse[] }> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}/rounds`, {
      method: 'POST',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to create round')
    }
    return response.data
  }

  // Update a round
  const updateRound = async (
    chatId: string,
    roundId: string,
    request: UpdateRoundRequest
  ): Promise<Round & { responses: AgentResponse[] }> => {
    const response = await fetchApi(`${API_BASE}/chats/${chatId}/rounds/${roundId}`, {
      method: 'PUT',
      body: request
    })
    if (!response.success) {
      throw new Error('Failed to update round')
    }
    return response.data
  }

  // Delete a round
  const deleteRound = async (chatId: string, roundId: string): Promise<void> => {
    const response = await fetchApi(
      `${API_BASE}/chats/${chatId}/rounds/${roundId}`,
      {
        method: 'DELETE'
      }
    )
    if (!response.success) {
      throw new Error('Failed to delete round')
    }
  }

  // Count tokens
  const countTokensInText = async (text: string, model: string = 'gpt-4'): Promise<number> => {
    // Use client-side token counting for real-time updates
    return countTokens(text, model as any)
  }

  return {
    getChats,
    getChat,
    createChat,
    updateChat,
    deleteChat,
    createAgent,
    updateAgent,
    deleteAgent,
    createRound,
    updateRound,
    deleteRound,
    countTokensInText
  }
}

