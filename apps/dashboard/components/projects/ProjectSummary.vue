<template>
  <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-red-700 dark:text-red-300">Total CO₂ Emissions</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-200">
            {{ formatCO2(analytics.totalEmissionsGrams) }}
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
            {{ formatEnergy(analytics.totalEnergyJoules) }}
          </p>
        </div>
        <Zap class="w-8 h-8 text-blue-600" />
      </div>
    </div>

    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-green-700 dark:text-green-300">Total Tokens</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-200">
            {{ totalTokens }}
          </p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">
            Avg: {{ formatNumber(averageTokensPerTransaction) }} per transaction
          </p>
        </div>
        <Calculator class="w-8 h-8 text-green-600" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, Zap, Calculator } from 'lucide-vue-next'
import type { ProjectAnalytics, Calculation } from '~/types/watttime'
import { formatCO2, formatEnergy } from '~/utils/formatting'

interface Props {
  analytics: ProjectAnalytics | null
  calculations?: readonly Calculation[]
}

const props = defineProps<Props>()

const totalTokens = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + calc.token_count, 0)
})

const averageTokensPerTransaction = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return Math.round(totalTokens.value / props.calculations.length)
})

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toLocaleString()
}
</script>

