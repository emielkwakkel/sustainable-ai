<template>
  <div class="space-y-8">
    <!-- Project Header -->
    <ProjectHeader
      :project="project"
      @import-csv="showImportCSVModal = true"
      @import-api="showImportModal = true"
      @add-calculation="showAddCalculationModal = true"
    />

    <!-- Summary Section -->
    <div v-if="analytics" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Summary</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400">Total Emissions:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ formatNumber(analytics.totalEmissionsGrams, 2) }}g CO₂
          </span>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400">Total Energy:</span>
          <span class="ml-2 font-medium text-gray-900 dark:text-white">
            {{ formatNumber(analytics.totalEnergyJoules / 3600000, 4) }}kWh
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
            {{ formatNumber(analytics.averageEmissionsPerToken, 4) }}g CO₂
          </span>
        </div>
      </div>
    </div>

    <!-- Analytics Summary Cards -->
    <ProjectSummary :analytics="analytics" />

    <!-- Charts Section -->
    <ProjectCharts :calculations="calculations" />

    <!-- Recent Calculations -->
    <ProjectCalculationsList :calculations="calculations" @recalculated="handleRecalculated" />

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Project } from '~/types/watttime'
import { useProject } from '../../composables/useProject'
import AddCalculationModal from '../../components/AddCalculationModal.vue'
import ImportFromCursorModal from '../../components/ImportFromCursorModal.vue'
import ImportCSVModal from '../../components/ImportCSVModal.vue'
import ProjectHeader from '../../components/projects/ProjectHeader.vue'
import ProjectSummary from '../../components/projects/ProjectSummary.vue'
import ProjectCharts from '../../components/projects/ProjectCharts.vue'
import ProjectCalculationsList from '../../components/projects/ProjectCalculationsList.vue'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string


// Composables
const { project, analytics, calculations, fetchProject, fetchCalculations } = useProject(projectId)

// State
const showAddCalculationModal = ref(false)
const showImportModal = ref(false)
const showImportCSVModal = ref(false)

// Methods
const handleCalculationCreated = async () => {
  showAddCalculationModal.value = false
  await fetchProject()
  await fetchCalculations()
}

const handleDataImported = async () => {
  showImportModal.value = false
  showImportCSVModal.value = false
  await fetchProject()
  await fetchCalculations()
}

const handleRecalculated = async () => {
  await fetchProject()
  await fetchCalculations()
}

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

// Set page title
useHead({
  title: computed(() => `${project.value?.name || 'Project'} - Sustainable AI Dashboard`)
})

// Load data on mount
onMounted(async () => {
  await fetchProject()
  await fetchCalculations()
})
</script>
