import type { TokenCalculatorPreset, TokenCalculatorFormData, PresetManager } from '~/types/watttime'

// Use native fetch to avoid Nuxt type inference issues
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

export const usePresets = (): PresetManager => {
  const USER_ID = 'default-user' // TODO: Get from auth
  
  // Reactive state
  const presets = ref<TokenCalculatorPreset[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch presets from API
  const fetchPresets = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/presets', {
        query: { user_id: USER_ID }
      }) as any

      if (response.success) {
        presets.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch presets')
      }
    } catch (err) {
      console.error('Error fetching presets:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch presets'
    } finally {
      loading.value = false
    }
  }

  // Load a preset configuration
  const loadPreset = (id: string): TokenCalculatorFormData | null => {
    const preset = presets.value.find(p => p.id === id)
    return preset ? preset.configuration : null
  }

  // Save a new preset
  const savePreset = async (name: string, description: string, configuration: TokenCalculatorFormData): Promise<string> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/presets', {
        method: 'POST',
        body: {
          name,
          description,
          configuration,
          user_id: USER_ID
        }
      }) as any

      if (response.success) {
        await fetchPresets() // Refresh the list
        return response.data.id
      } else {
        throw new Error(response.error || 'Failed to save preset')
      }
    } catch (err) {
      console.error('Error saving preset:', err)
      error.value = err instanceof Error ? err.message : 'Failed to save preset'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete a preset
  const deletePreset = async (id: string): Promise<boolean> => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/presets/${id}`, {
        method: 'DELETE',
        query: { user_id: USER_ID }
      }) as any

      if (response.success) {
        await fetchPresets() // Refresh the list
        return true
      } else {
        throw new Error(response.error || 'Failed to delete preset')
      }
    } catch (err) {
      console.error('Error deleting preset:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete preset'
      return false
    } finally {
      loading.value = false
    }
  }

  // Update a preset
  const updatePreset = async (id: string, name: string, description: string, configuration: TokenCalculatorFormData): Promise<boolean> => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/presets/${id}`, {
        method: 'PUT',
        body: {
          name,
          description,
          configuration,
          user_id: USER_ID
        }
      }) as any

      if (response.success) {
        await fetchPresets() // Refresh the list
        return true
      } else {
        throw new Error(response.error || 'Failed to update preset')
      }
    } catch (err) {
      console.error('Error updating preset:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update preset'
      return false
    } finally {
      loading.value = false
    }
  }

  // Migrate localStorage presets on first load
  const migrateLocalStoragePresets = async () => {
    if (typeof window === 'undefined') return

    const STORAGE_KEY = 'token-calculator-presets'
    const MIGRATION_KEY = 'token-calculator-presets-migrated'

    // Check if migration already completed
    if (localStorage.getItem(MIGRATION_KEY)) {
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as TokenCalculatorPreset[]
        
        // Migrate each preset to database
        for (const preset of parsed) {
          // Skip if it's marked as default (these are now system presets)
          if ((preset as any).isDefault) {
            continue
          }

          try {
            await savePreset(preset.name, preset.description || '', preset.configuration)
          } catch (err) {
            console.error(`Failed to migrate preset ${preset.name}:`, err)
            // Continue with other presets even if one fails
          }
        }

        // Mark migration as complete
        localStorage.setItem(MIGRATION_KEY, 'true')
        
        // Optionally clear old localStorage data after successful migration
        // localStorage.removeItem(STORAGE_KEY)
      }
    } catch (err) {
      console.error('Error migrating localStorage presets:', err)
      // Don't throw - migration failure shouldn't break the app
    }
  }

  // Initialize: fetch presets and migrate localStorage if needed
  onMounted(async () => {
    await fetchPresets()
    await migrateLocalStoragePresets()
  })

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    updatePreset,
    fetchPresets,
    loading,
    error
  }
}
