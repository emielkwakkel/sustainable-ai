import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useProjects } from '~/composables/useProjects'

// Mock $fetch
const mockFetch = vi.fn()
vi.mock('#app', () => ({
  $fetch: mockFetch
}))

// Mock global $fetch
global.$fetch = mockFetch as any

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with empty projects array', () => {
    const { projects, loading, error } = useProjects()
    
    expect(projects.value).toEqual([])
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should fetch projects successfully', async () => {
    const mockProjects = [
      {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        calculation_preset_id: 'gpt-4',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        user_id: 'user-1',
        calculation_count: 5,
        total_emissions_grams: 100,
        total_energy_joules: 1000
      }
    ]

    mockFetch.mockResolvedValue({
      success: true,
      data: mockProjects
    })

    const { fetchProjects, projects } = useProjects()
    
    await fetchProjects()
    
    expect(projects.value).toEqual(mockProjects)
    expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
      query: { user_id: 'default-user' }
    })
  })

  it('should handle fetch projects error', async () => {
    const errorMessage = 'Failed to fetch projects'
    mockFetch.mockRejectedValue(new Error(errorMessage))

    const { fetchProjects, error } = useProjects()
    
    await fetchProjects()
    
    expect(error.value).toBe(errorMessage)
  })

  it('should create project successfully', async () => {
    const newProject = {
      id: '2',
      name: 'New Project',
      description: 'New Description',
      calculation_preset_id: 'gpt-4',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user_id: 'user-1'
    }

    mockFetch.mockResolvedValue({
      success: true,
      data: newProject
    })

    const { createProject } = useProjects()
    
    const result = await createProject({
      name: 'New Project',
      description: 'New Description',
      calculation_preset_id: 'gpt-4'
    })
    
    expect(result).toEqual(newProject)
    expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
      method: 'POST',
      body: {
        name: 'New Project',
        description: 'New Description',
        calculation_preset_id: 'gpt-4',
        user_id: 'default-user'
      }
    })
  })

  it('should update project successfully', async () => {
    const updatedProject = {
      id: '1',
      name: 'Updated Project',
      description: 'Updated Description',
      calculation_preset_id: 'gpt-3.5-turbo',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      user_id: 'user-1'
    }

    mockFetch.mockResolvedValue({
      success: true,
      data: updatedProject
    })

    const { updateProject } = useProjects()
    
    const result = await updateProject('1', {
      name: 'Updated Project',
      description: 'Updated Description',
      calculation_preset_id: 'gpt-3.5-turbo'
    })
    
    expect(result).toEqual(updatedProject)
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
      method: 'PUT',
      body: {
        name: 'Updated Project',
        description: 'Updated Description',
        calculation_preset_id: 'gpt-3.5-turbo',
        user_id: 'default-user'
      }
    })
  })

  it('should delete project successfully', async () => {
    mockFetch.mockResolvedValue({
      success: true,
      message: 'Project deleted successfully'
    })

    const { deleteProject } = useProjects()
    
    const result = await deleteProject('1')
    
    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', {
      method: 'DELETE',
      query: { user_id: 'default-user' }
    })
  })

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'API Error'
    mockFetch.mockResolvedValue({
      success: false,
      error: errorMessage
    })

    const { createProject, error } = useProjects()
    
    try {
      await createProject({
        name: 'Test Project',
        description: 'Test Description',
        calculation_preset_id: 'gpt-4'
      })
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      expect((err as Error).message).toBe(errorMessage)
    }
  })
})
