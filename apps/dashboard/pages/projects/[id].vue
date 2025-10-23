<template>
  <div class="space-y-8">
    <!-- Project Header -->
    <div class="flex items-center justify-between">
      <div>
        <nav class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <NuxtLink to="/projects" class="hover:text-gray-700 dark:hover:text-gray-300">Projects</NuxtLink>
          <ChevronRight class="w-4 h-4" />
          <span>{{ project?.name || 'Loading...' }}</span>
        </nav>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ project?.name || 'Loading...' }}
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ project?.description || 'No description' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="showImportModal = true"
          class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download class="w-4 h-4" />
          Import from Cursor
        </button>
        <button
          @click="showAddCalculationModal = true"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Add Calculation
        </button>
      </div>
    </div>

    <!-- Analytics Summary -->
    <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-red-700 dark:text-red-300">Total CO₂ Emissions</p>
            <p class="text-2xl font-bold text-red-900 dark:text-red-200">
              {{ formatNumber(analytics.totalEmissionsGrams, 2) }}g
            </p>
          </div>
          <TrendingUp class="w-8 h-8 text-red-600" />
        </div>
      </div>

      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-blue-700 dark:text-blue-300">Total Energy</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {{ formatNumber(analytics.totalEnergyJoules / 3600000, 4) }}kWh
            </p>
          </div>
          <Zap class="w-8 h-8 text-blue-600" />
        </div>
      </div>

      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-700 dark:text-green-300">Calculations</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-200">
              {{ analytics.calculationCount }}
            </p>
          </div>
          <Calculator class="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Emissions Over Time Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          CO₂ Emissions Over Time
        </h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <BarChart3 class="w-16 h-16" />
          <p class="ml-2">Chart will be implemented</p>
        </div>
      </div>

      <!-- Energy Consumption Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Energy Consumption Over Time
        </h3>
        <div class="h-64 flex items-center justify-center text-gray-500">
          <BarChart3 class="w-16 h-16" />
          <p class="ml-2">Chart will be implemented</p>
        </div>
      </div>
    </div>

    <!-- Recent Calculations -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Calculations
        </h3>
      </div>
      <div class="p-6">
        <div v-if="calculations.length > 0" class="space-y-4">
          <div
            v-for="calculation in calculations"
            :key="calculation.id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Calculator class="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ calculation.token_count.toLocaleString() }} tokens
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ calculation.model }} • {{ formatDate(calculation.created_at) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-medium text-red-600 dark:text-red-400">
                {{ formatNumber(calculation.results.totalEmissionsGrams, 3) }}g CO₂
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatNumber(calculation.results.energyJoules / 3600000, 4) }}kWh
              </p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calculator class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No calculations yet</p>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronRight, Download, Plus, TrendingUp, Zap, Calculator, BarChart3 } from 'lucide-vue-next'
import type { Project, Calculation } from '~/types/watttime'
import { useProject } from '../../composables/useProject'
import AddCalculationModal from '../../components/AddCalculationModal.vue'
import ImportFromCursorModal from '../../components/ImportFromCursorModal.vue'

// Get project ID from route
const route = useRoute()
const projectId = route.params.id as string


// Composables
const { project, analytics, calculations, fetchProject, fetchCalculations } = useProject(projectId)

// State
const showAddCalculationModal = ref(false)
const showImportModal = ref(false)

// Methods
const handleCalculationCreated = async () => {
  showAddCalculationModal.value = false
  await fetchProject()
  await fetchCalculations()
}

const handleDataImported = async () => {
  showImportModal.value = false
  await fetchProject()
  await fetchCalculations()
}

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
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
