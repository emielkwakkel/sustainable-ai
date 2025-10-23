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

// Mock Vue composables
const mockRef = vi.fn((val) => ({ value: val }))
const mockComputed = vi.fn((fn) => ({ value: fn() }))
const mockReadonly = vi.fn((val) => val)
const mockWatch = vi.fn()

// Mock Vue imports
vi.mock('vue', () => ({
  ref: mockRef,
  computed: mockComputed,
  readonly: mockReadonly,
  watch: mockWatch
}))

// Mock Nuxt auto-imports
vi.mock('#app', () => ({
  ref: mockRef,
  computed: mockComputed,
  readonly: mockReadonly,
  watch: mockWatch
}))

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

  it('should update dark mode preference', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { updatePreference } = useAppPreferences()
    
    // Update dark mode to true
    updatePreference('darkMode', true)
    
    // Check that localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_preferences',
      expect.stringContaining('"darkMode":true')
    )
  })

  it('should update dark mode preference from stored value', () => {
    const storedPreferences = { darkMode: true }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences))
    
    const { updatePreference } = useAppPreferences()
    
    // Update dark mode to false
    updatePreference('darkMode', false)
    
    // Check that localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app_preferences',
      expect.stringContaining('"darkMode":false')
    )
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
    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock localStorage.getItem to return invalid JSON
    localStorageMock.getItem.mockReturnValue('invalid json')
    
    const { preferences } = useAppPreferences()
    
    // Should fall back to default preferences
    expect(preferences.value).toEqual({
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 5,
      defaultRegion: undefined
    })
    
    // Should log the error
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing stored preferences:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})
