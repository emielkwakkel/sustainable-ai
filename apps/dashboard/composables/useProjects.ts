import type { Project, ProjectsApiResponse } from '~/types/watttime'

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

export const useProjects = () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchProjects = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/projects', {
        query: { user_id: 'default-user' } // TODO: Get from auth
      }) as any

      if (response.success) {
        projects.value = response.data
      } else {
        throw new Error(response.error || 'Failed to fetch projects')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch projects'
    } finally {
      loading.value = false
    }
  }

  const createProject = async (projectData: {
    name: string
    description?: string
    calculation_preset_id: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi('/api/projects', {
        method: 'POST',
        body: {
          ...projectData,
          user_id: 'default-user' // TODO: Get from auth
        }
      })

      if (response.success) {
        await fetchProjects() // Refresh the list
        return response.data
      } else {
        throw new Error(response.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create project'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (projectId: string, projectData: {
    name?: string
    description?: string
    calculation_preset_id?: string
  }) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: {
          ...projectData,
          user_id: 'default-user' // TODO: Get from auth
        }
      })

      if (response.success) {
        await fetchProjects() // Refresh the list
        return response.data
      } else {
        throw new Error(response.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Error updating project:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update project'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProject = async (projectId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await fetchApi(`/api/projects/${projectId}`, {
        method: 'DELETE',
        query: { user_id: 'default-user' } // TODO: Get from auth
      })

      if (response.success) {
        await fetchProjects() // Refresh the list
        return true
      } else {
        throw new Error(response.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete project'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    projects: readonly(projects),
    loading: readonly(loading),
    error: readonly(error),
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}
