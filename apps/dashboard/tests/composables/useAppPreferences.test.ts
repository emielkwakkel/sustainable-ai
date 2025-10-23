import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAppPreferences } from '~/composables/useAppPreferences'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock document
const mockDocumentElement = {
  classList: {
    add: vi.fn(),
    remove: vi.fn()
  }
}

describe('useAppPreferences', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Mock window and document
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
    
    Object.defineProperty(document, 'documentElement', {
      value: mockDocumentElement,
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default preferences', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { preferences } = useAppPreferences()
    
    expect(preferences.value).toEqual({
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 5,
      defaultRegion: undefined
    })
  })

  it('should load preferences from localStorage', () => {
    const storedPreferences = {
      darkMode: true,
      autoRefresh: false,
      refreshInterval: 10,
      defaultRegion: 'US-CA'
    }
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences))
    
    const { preferences } = useAppPreferences()
    
    expect(preferences.value).toEqual(storedPreferences)
  })

  it('should apply dark mode class when darkMode is true', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { updatePreference } = useAppPreferences()
    
    // Update dark mode to true
    updatePreference('darkMode', true)
    
    // Check if dark class was added
    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark')
  })

  it('should remove dark mode class when darkMode is false', () => {
    const storedPreferences = { darkMode: true }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences))
    
    const { updatePreference } = useAppPreferences()
    
    // Update dark mode to false
    updatePreference('darkMode', false)
    
    // Check if dark class was removed
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark')
  })

  it('should save preferences to localStorage when updated', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { updatePreference } = useAppPreferences()
    
    updatePreference('darkMode', true)
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_preferences',
      JSON.stringify({
        darkMode: true,
        autoRefresh: true,
        refreshInterval: 5,
        defaultRegion: undefined
      })
    )
  })

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const { preferences } = useAppPreferences()
    
    // Should fall back to default preferences
    expect(preferences.value).toEqual({
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 5,
      defaultRegion: undefined
    })
  })
})
