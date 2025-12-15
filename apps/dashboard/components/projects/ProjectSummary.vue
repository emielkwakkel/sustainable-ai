<template>
  <div v-if="analytics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-red-700 dark:text-red-300">{{ labelPrefix }} CO₂ Emissions</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-200">
            {{ formatCO2(filteredEmissionsGrams) }}
          </p>
          <p class="text-xs text-red-700 dark:text-red-300 mt-1">
            🚗 ⛽️ Equals driving an average gasoline car for {{ formatKilometers(filteredEmissionsGrams) }} kilometers.
           </p>
        </div>
        <TrendingUp class="w-8 h-8 text-red-600" />
      </div>
    </div>

    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-blue-700 dark:text-blue-300">{{ labelPrefix }} Energy</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
            {{ formatEnergyWh(filteredEnergyJoules) }}
          </p>
          <p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
            🇳🇱 🏠 Equals {{ formatHouseholds(filteredEnergyJoules) }} Dutch households for a year.
           </p>
        </div>
        <Zap class="w-8 h-8 text-blue-600" />
      </div>
    </div>

    <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-green-700 dark:text-green-300">{{ labelPrefix }} Tokens</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-200">
            {{ formatNumberWithDots(totalTokens) }}
          </p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">
            Avg: {{ formatNumber(averageTokensPerTransaction) }} per transaction
          </p>
          <p v-if="filteredTotalCosts > 0" class="text-xs text-green-600 dark:text-green-400 mt-1">
            Total Cost: {{ formatCost(filteredTotalCosts) }}
          </p>
        </div>
        <Calculator class="w-8 h-8 text-green-600" />
      </div>
    </div>

    <!-- Token Breakdown Card -->
    <div v-if="hasTokenBreakdown" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
      <div class="flex items-center justify-between mb-3">
        <p class="text-sm font-medium text-purple-700 dark:text-purple-300">Token Breakdown</p>
        <Calculator class="w-6 h-6 text-purple-600" />
      </div>
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p class="text-purple-600 dark:text-purple-400">Input (w/ Cache)</p>
          <p class="text-lg font-bold text-purple-900 dark:text-purple-200">{{ formatNumber(totalInputWithCache) }}</p>
        </div>
        <div>
          <p class="text-purple-600 dark:text-purple-400">Input (w/o Cache)</p>
          <p class="text-lg font-bold text-purple-900 dark:text-purple-200">{{ formatNumber(totalInputWithoutCache) }}</p>
        </div>
        <div>
          <p class="text-purple-600 dark:text-purple-400">Cache Read</p>
          <p class="text-lg font-bold text-purple-900 dark:text-purple-200">{{ formatNumber(totalCacheRead) }}</p>
        </div>
        <div>
          <p class="text-purple-600 dark:text-purple-400">Output Tokens</p>
          <p class="text-lg font-bold text-purple-900 dark:text-purple-200">{{ formatNumber(totalOutputTokens) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, Zap, Calculator } from 'lucide-vue-next'
import type { ProjectAnalytics, Calculation } from '~/types/watttime'
import { formatCO2, formatEnergyWh, formatNumberWithDots, formatCost } from '~/utils/formatting'

interface Props {
  analytics: ProjectAnalytics | null
  calculations?: readonly Calculation[]
  hasActiveFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasActiveFilters: false
})

const totalTokens = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + calc.token_count, 0)
})

const averageTokensPerTransaction = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return Math.round(totalTokens.value / props.calculations.length)
})

const totalInputWithCache = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + (calc.input_with_cache || 0), 0)
})

const totalInputWithoutCache = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + (calc.input_without_cache || 0), 0)
})

const totalCacheRead = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + (calc.cache_read || 0), 0)
})

const totalOutputTokens = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => sum + (calc.output_tokens || 0), 0)
})

const hasTokenBreakdown = computed(() => {
  if (!props.calculations || props.calculations.length === 0) return false
  return props.calculations.some(calc => 
    (calc.input_with_cache !== undefined && calc.input_with_cache !== null) ||
    (calc.input_without_cache !== undefined && calc.input_without_cache !== null) ||
    (calc.cache_read !== undefined && calc.cache_read !== null) ||
    (calc.output_tokens !== undefined && calc.output_tokens !== null)
  )
})

const filteredEnergyJoules = computed(() => {
  // If filters are active, always use calculations (even if empty, show 0)
  if (props.hasActiveFilters) {
    if (!props.calculations || props.calculations.length === 0) return 0
    return props.calculations.reduce((sum, calc) => sum + (calc.results?.energyJoules || 0), 0)
  }
  // No filters active, use analytics grand total
  return props.analytics?.totalEnergyJoules || 0
})

const filteredEmissionsGrams = computed(() => {
  // If filters are active, always use calculations (even if empty, show 0)
  if (props.hasActiveFilters) {
    if (!props.calculations || props.calculations.length === 0) return 0
    return props.calculations.reduce((sum, calc) => sum + (calc.results?.totalEmissionsGrams || calc.results?.carbonEmissionsGrams || 0), 0)
  }
  // No filters active, use analytics grand total
  return props.analytics?.totalEmissionsGrams || 0
})

const filteredTotalCosts = computed(() => {
  // If filters are active, always use calculations (even if empty, show 0)
  if (props.hasActiveFilters) {
    if (!props.calculations || props.calculations.length === 0) return 0
    return props.calculations.reduce((sum, calc) => {
      const cost = calc.calculation_parameters?.cost ?? 0
      return sum + cost
    }, 0)
  }
  // No filters active, calculate from all calculations if available
  // Note: analytics doesn't include totalCosts yet, so we calculate from calculations
  if (!props.calculations || props.calculations.length === 0) return 0
  return props.calculations.reduce((sum, calc) => {
    const cost = calc.calculation_parameters?.cost ?? 0
    return sum + cost
  }, 0)
})

const labelPrefix = computed(() => {
  return props.hasActiveFilters ? 'Filtered' : 'Total'
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

const formatHouseholds = (joules: number): string => {
  if (!joules || joules === 0) return '0'
  
  // Convert joules to kWh (1 kWh = 3,600,000 J)
  const kWh = joules / 3_600_000
  
  // Average Dutch household uses 2420 kWh per year
  // Source: https://www.milieucentraal.nl/energie-besparen/inzicht-in-je-energierekening/gemiddeld-energieverbruik/
  const households = kWh / 2420
  
  if (households < 0.01) {
    // Very small number, show as decimal
    return households.toFixed(3)
  } else if (households < 1) {
    return households.toFixed(2)
  } else if (households < 1000) {
    return Math.round(households).toLocaleString()
  } else {
    // Large number, format with K/M suffix
    if (households >= 1_000_000) {
      return (households / 1_000_000).toFixed(2) + 'M'
    }
    return (households / 1000).toFixed(1) + 'K'
  }
}

const formatKilometers = (gramsCO2: number): string => {
  if (!gramsCO2 || gramsCO2 === 0) return '0'
  
  // Average gasoline car emits 120 grams CO2 per kilometer
  // Source: European Environment Agency and Dutch Rijkswaterstaat
  const kilometers = gramsCO2 / 120
  
  if (kilometers < 0.01) {
    // Very small number, show as decimal
    return kilometers.toFixed(3)
  } else if (kilometers < 1) {
    return kilometers.toFixed(2)
  } else if (kilometers < 1000) {
    return Math.round(kilometers).toLocaleString()
  } else {
    // Large number, format with K/M suffix
    if (kilometers >= 1_000_000) {
      return (kilometers / 1_000_000).toFixed(2) + 'M'
    }
    return (kilometers / 1000).toFixed(1) + 'K'
  }
}
</script>

