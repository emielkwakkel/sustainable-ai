<template>
  <div 
    :class="cn(
      'rounded-lg border p-6 transition-all duration-200 hover:shadow-md',
      'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      region.isLoading && 'animate-pulse',
      region.error && 'border-red-300 dark:border-red-600',
      intensityColor === 'red' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
      intensityColor === 'orange' && 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
      intensityColor === 'green' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    )"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <div 
          :class="cn(
            'w-3 h-3 rounded-full',
            intensityColor === 'red' && 'bg-red-500',
            intensityColor === 'orange' && 'bg-orange-500',
            intensityColor === 'green' && 'bg-green-500',
            !intensityColor && 'bg-gray-400'
          )"
        ></div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ region.name }}
        </h3>
      </div>
      <button
        v-if="!region.isLoading"
        @click="$emit('remove')"
        class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Remove region"
      >
        <X class="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- Content -->
    <div v-if="region.isLoading" class="space-y-3">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
    </div>

    <div v-else-if="region.error" class="text-center py-4">
      <AlertCircle class="w-8 h-8 text-red-500 mx-auto mb-2" />
      <p class="text-sm text-red-600 dark:text-red-400">{{ region.error }}</p>
      <button
        @click="$emit('retry')"
        class="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Retry
      </button>
    </div>

    <div v-else class="space-y-3">
      <!-- MOER Data -->
      <div v-if="region.moer !== undefined">
        <div class="flex items-baseline space-x-2">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ Math.round(region.moer) }}%
          </span>
          <span class="text-sm text-gray-600 dark:text-gray-400">percentile</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ intensityLevel }}
        </p>
      </div>

      <!-- AOER Data (when available) -->
      <div v-if="region.aoer !== undefined" class="pt-3 border-t border-gray-200 dark:border-gray-600">
        <div class="flex items-baseline space-x-2">
          <span class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ Math.round(region.aoer) }}
          </span>
          <span class="text-sm text-gray-600 dark:text-gray-400">gCO₂/kWh</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Average intensity</p>
      </div>

      <!-- Last Updated -->
      <div v-if="region.lastUpdated" class="pt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {{ formatTime(region.lastUpdated) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X, AlertCircle } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import type { DashboardRegion } from '~/types/watttime'

interface Props {
  region: DashboardRegion
}

const props = defineProps<Props>()

const emit = defineEmits<{
  remove: []
  retry: []
}>()

// Calculate color based on MOER percentile (0-100 range)
const intensityColor = computed(() => {
  if (props.region.moer === undefined) return null
  
  const percentile = props.region.moer
  
  if (percentile <= 33) return 'green'
  if (percentile <= 66) return 'orange'
  return 'red'
})

const intensityLevel = computed(() => {
  if (props.region.moer === undefined) return 'No data'
  
  const percentile = props.region.moer
  
  if (percentile <= 33) return 'Low carbon intensity'
  if (percentile <= 66) return 'Moderate carbon intensity'
  return 'High carbon intensity'
})

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}
</script>
