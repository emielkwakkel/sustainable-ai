<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" @click="close"></div>

      <!-- Modal panel -->
      <div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Set Cursor API Token
          </h3>
          <button
            @click="close"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Enter your Cursor API admin token to import usage data into your projects.
          </p>

          <!-- Token Input -->
          <div>
            <label for="token" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Token *
            </label>
            <input
              id="token"
              v-model="formData.token"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Cursor API token"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You can find your API token in your Cursor account settings
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 mt-6">
          <button
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSetToken"
            :disabled="loading || !formData.token.trim()"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Setting...
            </span>
            <span v-else>Set Token</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  tokenSet: []
}>()

// State
const formData = ref({
  token: ''
})

const loading = ref(false)
const error = ref<string | null>(null)

// Methods
const handleSetToken = async () => {
  if (!formData.value.token.trim()) {
    error.value = 'Please enter a valid API token'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Test the token first
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/cursor-import/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token: formData.value.token.trim() })
    })

    const data = await response.json()

    if (!data.success) {
      error.value = data.message || 'Invalid token'
      return
    }

    // Store token in localStorage
    localStorage.setItem('cursor_api_token', formData.value.token.trim())
    
    // Reset form
    formData.value = {
      token: ''
    }

    // Emit success
    emit('tokenSet')
  } catch (err) {
    console.error('Error setting Cursor token:', err)
    error.value = err instanceof Error ? err.message : 'Failed to set token'
  } finally {
    loading.value = false
  }
}

const close = () => {
  emit('close')
}
</script>
