<template>
  <div 
    v-if="!isConnected"
    class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6"
  >
    <div class="flex items-center space-x-3">
      <AlertTriangle class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          No WattTime Connection
        </h3>
        <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          Connect to WattTime to view real-time carbon intensity data.
        </p>
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

const { connectionStatus } = useTokenManager()

const isConnected = computed(() => connectionStatus.value.connected)
</script>
