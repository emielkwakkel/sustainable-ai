<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Carbon Aware Dashboard</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Monitor real-time carbon intensity across multiple regions
        </p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Placeholder cards -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-green-500 rounded-full"></div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Europe</h3>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">245 gCO₂/kWh</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Low carbon intensity</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">North America</h3>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">420 gCO₂/kWh</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Medium carbon intensity</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-red-500 rounded-full"></div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Asia Pacific</h3>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-2">680 gCO₂/kWh</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">High carbon intensity</p>
      </div>
    </div>

    <!-- Add Region Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Region</h3>
      <div class="flex space-x-4">
        <select class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>Select a region...</option>
          <option>Germany</option>
          <option>France</option>
          <option>United Kingdom</option>
          <option>Netherlands</option>
        </select>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Add Region
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'Dashboard - Sustainable AI Dashboard'
})
</script>
