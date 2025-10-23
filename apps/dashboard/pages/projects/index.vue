<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Manage and track carbon emissions across your AI projects
        </p>
      </div>
      <button
        @click="showCreateProjectModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Plus class="w-4 h-4" />
        New Project
      </button>
    </div>

    <!-- Projects Grid -->
    <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in projects"
        :key="project.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateToProject(project.id)"
      >
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ project.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ project.description || 'No description' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click.stop="editProject(project)"
              class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Edit class="w-4 h-4" />
            </button>
            <button
              @click.stop="deleteProject(project.id)"
              class="p-1 text-gray-400 hover:text-red-600"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <!-- Emissions Summary -->
          <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-red-700 dark:text-red-300">Total CO₂</span>
              <span class="text-lg font-bold text-red-900 dark:text-red-200">
                {{ formatNumber(project.total_emissions_grams || 0, 2) }}g
              </span>
            </div>
          </div>

          <!-- Energy Summary -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-700 dark:text-blue-300">Total Energy</span>
              <span class="text-lg font-bold text-blue-900 dark:text-blue-200">
                {{ formatNumber((project.total_energy_joules || 0) / 3600000, 4) }}kWh
              </span>
            </div>
          </div>

          <!-- Calculations Count -->
          <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{{ project.calculation_count }} calculations</span>
            <span>{{ formatDate(project.created_at) }}</span>
          </div>

          <!-- Preset Info -->
          <div class="mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
              {{ getPresetDisplayName(project.calculation_preset_id) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <FolderPlus class="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No Projects Yet
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Create your first project to start tracking carbon emissions
      </p>
      <button
        @click="showCreateProjectModal = true"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Create Project
      </button>
    </div>

    <!-- Create Project Modal -->
    <CreateProjectModal
      v-if="showCreateProjectModal"
      @close="showCreateProjectModal = false"
      @created="handleProjectCreated"
    />

    <!-- Edit Project Modal -->
    <EditProjectModal
      v-if="showEditProjectModal"
      :project="selectedProject"
      @close="showEditProjectModal = false"
      @updated="handleProjectUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Edit, Trash2, FolderPlus } from 'lucide-vue-next'
import type { Project } from '~/types/watttime'
import { useProjects } from '~/composables/useProjects'
import { useProjectPresets } from '~/composables/useProjectPresets'
import CreateProjectModal from '~/components/CreateProjectModal.vue'
import EditProjectModal from '~/components/EditProjectModal.vue'

// Set page title
useHead({
  title: 'Projects - Sustainable AI Dashboard'
})

// Composables
const { projects, fetchProjects, deleteProject: deleteProjectApi } = useProjects()
const { getPresetName } = useProjectPresets()

// State
const showCreateProjectModal = ref(false)
const showEditProjectModal = ref(false)
const selectedProject = ref<Project | null>(null)

// Methods
const navigateToProject = (projectId: string) => {
  navigateTo(`/projects/${projectId}`)
}

const editProject = (project: Project) => {
  selectedProject.value = project
  showEditProjectModal.value = true
}

const deleteProject = async (projectId: string) => {
  if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    try {
      await deleteProjectApi(projectId)
      await fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }
}

const handleProjectCreated = async () => {
  showCreateProjectModal.value = false
  await fetchProjects()
}

const handleProjectUpdated = async () => {
  showEditProjectModal.value = false
  selectedProject.value = null
  await fetchProjects()
}

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const getPresetDisplayName = (presetId: string): string => {
  return getPresetName(presetId)
}

// Load projects on mount
onMounted(async () => {
  await fetchProjects()
})
</script>
