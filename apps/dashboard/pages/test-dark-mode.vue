<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
    <h1 class="text-3xl font-bold mb-4">Dark Mode Test</h1>
    
    <div class="space-y-4">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold mb-2">Test Card</h2>
        <p class="text-gray-600 dark:text-gray-300">
          This card should change colors when dark mode is toggled.
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <button 
          @click="toggleDarkMode"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Toggle Dark Mode
        </button>
        
        <div class="text-sm text-gray-600 dark:text-gray-300">
          Current mode: {{ preferences.darkMode ? 'Dark' : 'Light' }}
        </div>
      </div>
      
      <div class="text-sm text-gray-500 dark:text-gray-400">
        HTML classes: {{ htmlClasses }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppPreferences } from '~/composables/useAppPreferences'

// Set page title
useHead({
  title: 'Dark Mode Test - Sustainable AI Dashboard'
})

const { preferences, updatePreference } = useAppPreferences()

const htmlClasses = ref('')

const toggleDarkMode = () => {
  console.log('Current dark mode:', preferences.value.darkMode)
  updatePreference('darkMode', !preferences.value.darkMode)
  console.log('New dark mode:', preferences.value.darkMode)
  updateHtmlClasses()
}

const updateHtmlClasses = () => {
  htmlClasses.value = document.documentElement.classList.toString()
}

onMounted(() => {
  updateHtmlClasses()
  console.log('Page mounted, dark mode:', preferences.value.darkMode)
  console.log('HTML classes:', document.documentElement.classList.toString())
})
</script>
