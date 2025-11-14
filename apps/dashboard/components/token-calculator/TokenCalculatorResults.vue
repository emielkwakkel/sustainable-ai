<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
    
    <div class="space-y-4">
      <!-- Energy Results -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 class="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">Energy Consumption</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {{ formatEnergyJoules(result.energyJoules) }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300">Energy</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {{ formatEnergyWh(result.energyJoules) }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300">Energy</p>
          </div>
        </div>
      </div>

      <!-- Carbon Emissions -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <h3 class="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Carbon Emissions</h3>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-2xl font-bold text-red-900 dark:text-red-200">
              {{ formatCO2(result.carbonEmissionsGrams, 4) }}
            </p>
            <p class="text-sm text-red-700 dark:text-red-300">per token</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-900 dark:text-red-200">
              {{ formatCO2(result.totalEmissionsGrams, 2) }}
            </p>
            <p class="text-sm text-red-700 dark:text-red-300">total</p>
          </div>
        </div>
      </div>

      <!-- Comparison Metrics -->
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <h3 class="text-lg font-medium text-green-900 dark:text-green-200 mb-2">Equivalent To</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-green-700 dark:text-green-300">Lightbulb (10W):</span>
            <span class="font-medium text-green-900 dark:text-green-200">
              {{ formatDuration(result.equivalentLightbulbMinutes) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-700 dark:text-green-300">Car miles:</span>
            <span class="font-medium text-green-900 dark:text-green-200">
              {{ formatNumber(result.equivalentCarMiles, 2) }} miles
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-700 dark:text-green-300">Tree absorption:</span>
            <span class="font-medium text-green-900 dark:text-green-200">
              {{ formatDuration(result.equivalentTreeHours * 60) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Export Button -->
      <button
        v-if="showExport"
        @click="$emit('export')"
        class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
      >
        Export Results
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CalculationResult } from '~/types/watttime'
import { formatEnergyJoules, formatEnergyWh, formatCO2, formatDuration } from '~/utils/formatting'
import { useTokenCalculator } from '~/composables/useTokenCalculator'

interface Props {
  result: CalculationResult
  showExport?: boolean
}

withDefaults(defineProps<Props>(), {
  showExport: true
})

defineEmits<{
  export: []
}>()

const { formatNumber } = useTokenCalculator()
</script>

