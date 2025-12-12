<template>
  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
    <div class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
      <Calculator class="w-8 h-8 text-gray-400 dark:text-gray-500" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      Ready to Calculate
    </h3>
    <p class="text-gray-600 dark:text-gray-400">
      Enter your token count and configuration to see the carbon footprint
    </p>
  </div>
</template>

<script setup lang="ts">
import { Calculator } from 'lucide-vue-next'
</script>




