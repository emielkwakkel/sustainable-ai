<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Import from Cursor API
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- API Token -->
          <div>
            <label for="api_token" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cursor API Token *
            </label>
            <input
              id="api_token"
              v-model="formData.api_token"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your Cursor API token"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get your API token from Cursor settings
            </p>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="start_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                id="start_date"
                v-model="formData.start_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label for="end_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date *
              </label>
              <input
                id="end_date"
                v-model="formData.end_date"
                type="date"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Test Connection Button -->
          <div class="flex items-center justify-between">
            <button
              type="button"
              @click="testConnection"
              :disabled="!formData.api_token || testingConnection"
              class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="testingConnection">Testing...</span>
              <span v-else>Test Connection</span>
            </button>
            <div v-if="connectionStatus" class="flex items-center gap-2">
              <CheckCircle v-if="connectionStatus === 'success'" class="w-5 h-5 text-green-600" />
              <XCircle v-else-if="connectionStatus === 'error'" class="w-5 h-5 text-red-600" />
              <span class="text-sm" :class="connectionStatus === 'success' ? 'text-green-600' : 'text-red-600'">
                {{ connectionStatus === 'success' ? 'Connected' : 'Failed' }}
              </span>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>

          <!-- Success Message -->
          <div v-if="importResult" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p class="text-sm text-green-700 dark:text-green-300">
              Successfully imported {{ importResult.importedCount }} calculations
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading || !formData.api_token || !formData.start_date || !formData.end_date"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="loading">Importing...</span>
              <span v-else>Import Data</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, CheckCircle, XCircle } from 'lucide-vue-next'

// Props
interface Props {
  projectId: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  imported: []
}>()

// State
const formData = ref({
  api_token: '',
  start_date: '',
  end_date: ''
})

const loading = ref(false)
const testingConnection = ref(false)
const error = ref<string | null>(null)
const connectionStatus = ref<'success' | 'error' | null>(null)
const importResult = ref<any>(null)

// Computed
const isFormValid = computed(() => {
  return formData.value.api_token && formData.value.start_date && formData.value.end_date
})

// Methods
const testConnection = async () => {
  if (!formData.value.api_token) return

  testingConnection.value = true
  connectionStatus.value = null
  error.value = null

  try {
    const response = await fetch('/api/cursor-import/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_token: formData.value.api_token
      })
    })
    const data = await response.json()

    if (data.success) {
      connectionStatus.value = 'success'
    } else {
      connectionStatus.value = 'error'
      error.value = data.error || 'Connection failed'
    }
  } catch (err) {
    console.error('Error testing connection:', err)
    connectionStatus.value = 'error'
    error.value = err instanceof Error ? err.message : 'Failed to test connection'
  } finally {
    testingConnection.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = null
  importResult.value = null

  try {
    const response = await fetch('/api/cursor-import/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: props.projectId,
        start_date: formData.value.start_date,
        end_date: formData.value.end_date,
        api_token: formData.value.api_token,
        user_id: 'default-user' // TODO: Get from auth
      })
    })
    const data = await response.json()

    if (data.success) {
      importResult.value = data.data
      // Emit success
      emit('imported')
    } else {
      throw new Error(data.error || 'Failed to import data')
    }
  } catch (err) {
    console.error('Error importing data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to import data'
  } finally {
    loading.value = false
  }
}

// Set default date range (last 30 days)
const today = new Date()
const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

formData.value.end_date = today.toISOString().split('T')[0] || ''
formData.value.start_date = thirtyDaysAgo.toISOString().split('T')[0] || ''
</script>
