import type { CursorTestApiResponse } from '~/types/watttime'

export const useCursorApi = () => {
  // Set Cursor API token
  const setCursorToken = async (token: string): Promise<void> => {
    try {
      const response = await fetch('/api/cursor-import/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to validate token')
      }

      // Store token in localStorage
      localStorage.setItem('cursor_api_token', token)
    } catch (error) {
      console.error('Error setting Cursor token:', error)
      throw error
    }
  }

  // Test Cursor API connection
  const testCursorConnection = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const token = localStorage.getItem('cursor_api_token')
      if (!token) {
        return {
          success: false,
          message: 'No Cursor API token found. Please set a token first.'
        }
      }

      const response = await fetch('/api/cursor-import/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      })

      const data = await response.json() as CursorTestApiResponse

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Connection test failed'
        }
      }

      return {
        success: true,
        message: data.message || 'Connection successful'
      }
    } catch (error) {
      console.error('Error testing Cursor connection:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  // Clear Cursor API token
  const clearCursorToken = (): void => {
    localStorage.removeItem('cursor_api_token')
  }

  // Get Cursor API token
  const getCursorToken = (): string | null => {
    return localStorage.getItem('cursor_api_token')
  }

  // Check if Cursor API is connected
  const isCursorConnected = (): boolean => {
    return getCursorToken() !== null
  }

  return {
    setCursorToken,
    testCursorConnection,
    clearCursorToken,
    getCursorToken,
    isCursorConnected
  }
}
