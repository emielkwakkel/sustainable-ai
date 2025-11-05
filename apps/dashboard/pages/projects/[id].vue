<template>
  <div class="space-y-8">
    <!-- Project Header -->
    <ProjectHeader
      :project="project"
      @import-csv="showImportCSVModal = true"
      @import-api="showImportModal = true"
      @add-calculation="showAddCalculationModal = true"
    />

    <!-- Preset Configuration Section -->
    <div v-if="project" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Calculation Preset</h2>
        <button
          @click="showPresetModal = true"
          class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <Settings class="w-4 h-4" />
          Change Preset
        </button>
      </div>
      <div v-if="currentPreset" class="space-y-2">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Preset:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ currentPreset.name }}
          </span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ currentPreset.description }}
        </p>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Model:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ currentPreset.configuration.model }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Hardware:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ currentPreset.configuration.hardware }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Provider:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ currentPreset.configuration.dataCenterProvider }}
            </span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Region:</span>
            <span class="ml-2 font-medium text-gray-900 dark:text-white">
              {{ currentPreset.configuration.dataCenterRegion }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <div v-if="analytics" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Summary</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Total Emissions:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ formatCO2(analytics.totalEmissionsGrams) }}
          </span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Total Energy:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ formatEnergy(analytics.totalEnergyJoules) }}
          </span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Total Calculations:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ analytics.calculationCount }}
          </span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Avg per Token:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ formatCO2(analytics.averageEmissionsPerToken) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Analytics Summary Cards -->
    <ProjectSummary :analytics="analytics" :calculations="chartCalculations" />

    <!-- Filters Section -->
    <ProjectFilters
      :project-id="projectId"
      :start-date="filters.startDate"
      :end-date="filters.endDate"
      :selected-tag-ids="filters.tagIds"
      @update:startDate="handleFilterChange('startDate', $event)"
      @update:endDate="handleFilterChange('endDate', $event)"
      @update:selectedTagIds="handleFilterChange('tagIds', $event)"
    />

    <!-- Charts Section -->
    <ProjectCharts :calculations="chartCalculations" />

    <!-- Recent Calculations -->
    <ProjectCalculationsList
      :calculations="calculations"
      :total-count="totalCount"
      :current-page="currentPage"
      :page-size="pageSize"
      :project-id="projectId"
      :project-preset-id="project?.calculation_preset_id"
      @recalculated="handleRecalculated"
      @deleted="handleDeleted"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

    <!-- Modals -->
    <AddCalculationModal
      v-if="showAddCalculationModal"
      :project-id="projectId"
      :project-preset-id="project?.calculation_preset_id"
      @close="showAddCalculationModal = false"
      @created="handleCalculationCreated"
    />

    <ImportFromCursorModal
      v-if="showImportModal"
      :project-id="projectId"
      @close="showImportModal = false"
      @imported="handleDataImported"
    />

    <ImportCSVModal
      v-if="showImportCSVModal"
      :project-id="projectId"
      :is-open="showImportCSVModal"
      @close="showImportCSVModal = false"
      @imported="handleDataImported"
    />

    <!-- Preset Selection Modal -->
    <div
      v-if="showPresetModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showPresetModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Select Preset</h3>
          <button
            @click="showPresetModal = false"
            class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="preset in getAllPresets()"
            :key="preset.id"
            @click="handlePresetChange(preset.id)"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-colors',
              currentPreset?.id === preset.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ preset.name }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ preset.description }}</p>
                <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ preset.configuration.model }}</span>
                  <span>•</span>
                  <span>{{ preset.configuration.hardware }}</span>
                  <span>•</span>
                  <span>{{ preset.configuration.dataCenterProvider }}</span>
                </div>
              </div>
              <div v-if="currentPreset?.id === preset.id" class="text-blue-600 dark:text-blue-400">
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Settings } from 'lucide-vue-next'
import type { Project, Calculation } from '~/types/watttime'
import { useProject } from '../../composables/useProject'
import { useProjectPresets } from '../../composables/useProjectPresets'
import { formatCO2, formatEnergy } from '~/utils/formatting'
import AddCalculationModal from '../../components/AddCalculationModal.vue'
import ImportFromCursorModal from '../../components/ImportFromCursorModal.vue'
import ImportCSVModal from '../../components/ImportCSVModal.vue'
import ProjectHeader from '../../components/projects/ProjectHeader.vue'
import ProjectSummary from '../../components/projects/ProjectSummary.vue'
import ProjectFilters from '../../components/projects/ProjectFilters.vue'
import ProjectCharts from '../../components/projects/ProjectCharts.vue'
import ProjectCalculationsList from '../../components/projects/ProjectCalculationsList.vue'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string


// Composables
const { project, analytics, calculations, totalCount, fetchProject, fetchCalculations } = useProject(projectId)
const { getPresetById, getAllPresets } = useProjectPresets()

// State
const showAddCalculationModal = ref(false)
const showImportModal = ref(false)
const showImportCSVModal = ref(false)
const showPresetModal = ref(false)

// Filters and Pagination
const filters = ref({
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined,
  tagIds: [] as number[]
})

const currentPage = ref(1)
const pageSize = ref(10)
const chartCalculations = ref<Calculation[]>([])

// Computed
const currentPreset = computed(() => {
  if (!project.value?.calculation_preset_id) return null
  return getPresetById(project.value.calculation_preset_id)
})

// Methods
const handleCalculationCreated = async () => {
  showAddCalculationModal.value = false
  await fetchProject()
  await loadCalculations()
}

const handleDataImported = async () => {
  showImportModal.value = false
  showImportCSVModal.value = false
  await fetchProject()
  await loadCalculations()
}

const handleFilterChange = async (key: string, value: any) => {
  filters.value = { ...filters.value, [key]: value }
  currentPage.value = 1 // Reset to first page when filters change
  await loadCalculations()
}

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await loadCalculations()
}

const handlePageSizeChange = async (size: number) => {
  pageSize.value = size
  currentPage.value = 1 // Reset to first page when changing page size
  await loadCalculations()
}

const loadCalculations = async () => {
  // Handle "All" option (pageSize = 0)
  const limit = pageSize.value === 0 ? 10000 : pageSize.value
  const offset = (currentPage.value - 1) * limit
  
  // Load paginated calculations for the list
  await fetchCalculations(limit, offset, {
    start_date: filters.value.startDate,
    end_date: filters.value.endDate,
    tag_ids: filters.value.tagIds.length > 0 ? filters.value.tagIds : undefined
  })
  
  // Load all filtered calculations for charts (with high limit)
  await loadChartCalculations()
}

const loadChartCalculations = async () => {
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const params = new URLSearchParams()
    params.append('user_id', 'default-user')
    params.append('limit', '10000')
    params.append('offset', '0')
    
    if (filters.value.startDate) params.append('start_date', filters.value.startDate)
    if (filters.value.endDate) params.append('end_date', filters.value.endDate)
    if (filters.value.tagIds.length > 0) {
      filters.value.tagIds.forEach(id => params.append('tag_ids', id.toString()))
    }
    
    const response = await fetch(`${apiBaseUrl}/api/calculations/project/${projectId}?${params.toString()}`)
    const data = await response.json()
    
    if (data.success) {
      chartCalculations.value = data.data.calculations || []
    }
  } catch (error) {
    console.error('Error loading chart calculations:', error)
  }
}

const handleRecalculated = async () => {
  await fetchProject()
  await loadCalculations()
}

const handleDeleted = async () => {
  await fetchProject()
  await loadCalculations()
}

const handlePresetChange = async (presetId: string) => {
  if (!project.value) return

  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_preset_id: presetId,
        user_id: 'default-user', // TODO: Get from auth
      }),
    })

    const data = await response.json()
    if (data.success) {
      showPresetModal.value = false
      await fetchProject()
    }
  } catch (error) {
    console.error('Error updating preset:', error)
  }
}

// Set page title
useHead({
  title: computed(() => `${project.value?.name || 'Project'} - Sustainable AI Dashboard`)
})

// Load data on mount
onMounted(async () => {
  await fetchProject()
  await loadCalculations()
})
</script>
