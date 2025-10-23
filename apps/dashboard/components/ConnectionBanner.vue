<template>
  <div 
    v-if="!isFullyConnected"
    class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6"
  >
    <div class="flex items-center space-x-3">
      <AlertTriangle class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          {{ getBannerTitle() }}
        </h3>
        <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          {{ getBannerMessage() }}
        </p>
        
        <!-- Detailed status indicators -->
        <div class="mt-2 flex flex-wrap gap-4 text-xs">
          <div class="flex items-center space-x-1">
            <div :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.watttime.connected ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-yellow-700 dark:text-yellow-300">
              WattTime: {{ connectionStatus.watttime.connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          
          <div class="flex items-center space-x-1">
            <div :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.api.healthy ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-yellow-700 dark:text-yellow-300">
              API: {{ connectionStatus.api.healthy ? 'Healthy' : 'Unhealthy' }}
            </span>
          </div>
        </div>
      </div>
      <NuxtLink
        to="/settings"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-700/50 transition-colors"
      >
        <Settings class="w-4 h-4 mr-2" />
        Go to Settings
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, Settings } from 'lucide-vue-next'
import { useTokenManager } from '~/composables/useTokenManager'

const { connectionStatus } = useTokenManager()

const isFullyConnected = computed(() => connectionStatus.value.overall)

const getBannerTitle = () => {
  const { watttime, api } = connectionStatus.value
  
  if (!watttime.connected && !api.healthy) {
    return 'Multiple Connection Issues'
  } else if (!watttime.connected) {
    return 'WattTime Connection Required'
  } else if (!api.healthy) {
    return 'API Server Unavailable'
  }
  return 'Connection Issues'
}

const getBannerMessage = () => {
  const { watttime, api } = connectionStatus.value
  
  if (!watttime.connected && !api.healthy) {
    return 'Both WattTime and API services are not available. Check your connections in settings.'
  } else if (!watttime.connected) {
    return 'Connect to WattTime to view real-time carbon intensity data.'
  } else if (!api.healthy) {
    return 'The middleware API server is not running. Start the API server on port 3001.'
  }
  return 'Connection issues detected.'
}
</script>
