import type { Project, Calculation, ProjectAnalytics, ProjectApiResponse, CalculationsApiResponse, CursorImportApiResponse } from '../types/watttime'

// Use native fetch to avoid Nuxt type inference issues
const fetchApi = async (url: string, options?: any): Promise<any> => {
  if (typeof window !== 'undefined') {
    // Client-side: use native fetch with full URL
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    console.log('API Base URL:', apiBaseUrl)
    let fullUrl = url.startsWith('http') ? url : `${apiBaseUrl}${url}`
    console.log('Full URL:', fullUrl)
    
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
    
    console.log('Final URL:', fullUrl)
    const response = await fetch(fullUrl, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: options?.body ? JSON.stringify(options.body) : undefined
    })
    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response data:', data)
    return data
  } else {
    // Server-side: use $fetch if available
    if (typeof $fetch !== 'undefined') {
      return $fetch(url, options)
    }
    throw new Error('$fetch is not available')
  }
}

export const useProject = (projectId: string) => {
  const project = ref<Project | null>(null)
  const analytics = ref<ProjectAnalytics | null>(null)
  const calculations = ref<Calculation[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProject = async () => {
    loading.value = true
    error.value = null

    try {
      console.log('Fetching project:', projectId)
      const response = await fetchApi(`/api/projects/${projectId}`, {
        query: { user_id: 'default-user' } // TODO: Get from auth
      }) as any

      console.log('Project API response:', response)
      if (response && response.success) {
        project.value = response.data.project
        analytics.value = response.data.analytics
        console.log('Project loaded:', project.value)
      } else {
        console.error('API response error:', response)
        error.value = response?.error || 'Failed to fetch project'
      }
    } catch (err) {
      console.error('Error fetching project:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch project'
    } finally {
      loading.value = false
    }
  }

  const fetchCalculations = async (limit = 50, offset = 0) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/calculations/project/${projectId}`, {
        query: { 
          user_id: 'default-user', // TODO: Get from auth
          limit,
          offset
        }
      }) as any

      if (response && response.success) {
        calculations.value = response.data.calculations || []
      } else {
        console.error('Calculations API response error:', response)
        error.value = response?.error || 'Failed to fetch calculations'
      }
    } catch (err) {
      console.error('Error fetching calculations:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch calculations'
    } finally {
      loading.value = false
    }
  }

  const addCalculation = async (calculationData: {
    token_count: number
    model: string
    context_length?: number
    context_window?: number
    hardware?: string
    data_center_provider?: string
    data_center_region?: string
    custom_pue?: number
    custom_carbon_intensity?: number
    calculation_parameters?: any
    results: any
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/calculations', {
        method: 'POST',
        body: {
          ...calculationData,
          project_id: projectId,
          user_id: 'default-user' // TODO: Get from auth
        }
      })

      if (response.success) {
        await fetchProject() // Refresh project data
        await fetchCalculations() // Refresh calculations
        return response.data
      } else {
        throw new Error(response.error || 'Failed to add calculation')
      }
    } catch (err) {
      console.error('Error adding calculation:', err)
      error.value = err instanceof Error ? err.message : 'Failed to add calculation'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCalculation = async (calculationId: string, calculationData: any) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/calculations/${calculationId}`, {
        method: 'PUT',
        body: {
          ...calculationData,
          user_id: 'default-user' // TODO: Get from auth
        }
      })

      if (response.success) {
        await fetchProject() // Refresh project data
        await fetchCalculations() // Refresh calculations
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update calculation')
      }
    } catch (err) {
      console.error('Error updating calculation:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update calculation'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCalculation = async (calculationId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/calculations/${calculationId}`, {
        method: 'DELETE',
        query: { user_id: 'default-user' } // TODO: Get from auth
      })

      if (response.success) {
        await fetchProject() // Refresh project data
        await fetchCalculations() // Refresh calculations
        return true
      } else {
        throw new Error(response.error || 'Failed to delete calculation')
      }
    } catch (err) {
      console.error('Error deleting calculation:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete calculation'
      throw err
    } finally {
      loading.value = false
    }
  }

  const importFromCursor = async (importData: {
    start_date: string
    end_date: string
    api_token: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/cursor-import/import', {
        method: 'POST',
        body: {
          ...importData,
          project_id: projectId,
          user_id: 'default-user' // TODO: Get from auth
        }
      })

      if (response.success) {
        await fetchProject() // Refresh project data
        await fetchCalculations() // Refresh calculations
        return response.data
      } else {
        throw new Error(response.error || 'Failed to import from Cursor')
      }
    } catch (err) {
      console.error('Error importing from Cursor:', err)
      error.value = err instanceof Error ? err.message : 'Failed to import from Cursor'
      throw err
    } finally {
      loading.value = false
    }
  }

  const recalculateProject = async (algorithmVersion: string = '1.0.0') => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/projects/${projectId}/recalculate`, {
        method: 'POST',
        body: {
          user_id: 'default-user', // TODO: Get from auth
          algorithm_version: algorithmVersion
        }
      })

      if (response.success) {
        await fetchProject() // Refresh project data
        await fetchCalculations() // Refresh calculations
        return response.data
      } else {
        throw new Error(response.error || 'Failed to recalculate project')
      }
    } catch (err) {
      console.error('Error recalculating project:', err)
      error.value = err instanceof Error ? err.message : 'Failed to recalculate project'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    project: readonly(project),
    analytics: readonly(analytics),
    calculations: readonly(calculations),
    loading: readonly(loading),
    error: readonly(error),
    fetchProject,
    fetchCalculations,
    addCalculation,
    updateCalculation,
    deleteCalculation,
    importFromCursor,
    recalculateProject
  }
}
