import type { AppPreferences } from '~/types/watttime'

const PREFERENCES_STORAGE_KEY = 'app_preferences'

const defaultPreferences: AppPreferences = {
  darkMode: false,
  autoRefresh: true,
  refreshInterval: 5, // minutes
  defaultRegion: undefined
}

export const useAppPreferences = () => {
  // Initialize preferences from localStorage or defaults
  const getStoredPreferences = (): AppPreferences => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          return { ...defaultPreferences, ...parsed }
        } catch (error) {
          console.error('Error parsing stored preferences:', error)
        }
      }
    }
    return defaultPreferences
  }

  // Reactive preferences state
  const preferences = ref<AppPreferences>(getStoredPreferences())

  // Save preferences to localStorage
  const savePreferences = (newPreferences: Partial<AppPreferences>): void => {
    const updatedPreferences = { ...preferences.value, ...newPreferences }
    preferences.value = updatedPreferences
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updatedPreferences))
    }
  }

  // Update a single preference
  const updatePreference = <K extends keyof AppPreferences>(
    key: K, 
    value: AppPreferences[K]
  ): void => {
    savePreferences({ [key]: value })
  }

  // Reset to default preferences
  const resetPreferences = (): void => {
    preferences.value = defaultPreferences
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(defaultPreferences))
    }
  }

  // Get a specific preference value
  const getPreference = <K extends keyof AppPreferences>(key: K): AppPreferences[K] => {
    return preferences.value[key]
  }

  // Watch for changes and apply them
  watch(preferences, (newPreferences) => {
    // Apply dark mode
    if (typeof window !== 'undefined') {
      const html = document.documentElement
      console.log('Applying dark mode:', newPreferences.darkMode)
      if (newPreferences.darkMode) {
        html.classList.add('dark')
        console.log('Added dark class')
      } else {
        html.classList.remove('dark')
        console.log('Removed dark class')
      }
      console.log('HTML classes after change:', html.classList.toString())
    }
  }, { deep: true, immediate: true })

  return {
    preferences: readonly(preferences),
    savePreferences,
    updatePreference,
    resetPreferences,
    getPreference
  }
}
