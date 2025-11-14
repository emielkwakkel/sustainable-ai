<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Model Manager</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Manage AI models, configure parameters, and set pricing
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Plus class="w-5 h-5" />
        Add Model
      </button>
    </div>

    <!-- Models Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-600 dark:text-gray-400">Loading models...</p>
      </div>

      <div v-else-if="error" class="p-8 text-center">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <button
          @click="fetchModels"
          class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>

      <div v-else-if="models.length === 0" class="p-8 text-center">
        <p class="text-gray-600 dark:text-gray-400">No models found. Create your first model to get started.</p>
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Parameters
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Context Length
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Complexity Factor
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pricing
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="model in models" :key="model.id" class="hover:bg-gray-50 dark:hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ model.name }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">{{ model.parameters }}B</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ model.contextLength.toLocaleString() }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ model.complexityFactor.toFixed(2) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm">
                <span v-if="model.pricing" class="text-green-600 dark:text-green-400">Yes</span>
                <span v-else class="text-gray-400 dark:text-gray-500">No</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm">
                <span v-if="model.isSystem" class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  System
                </span>
                <span v-else class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  Custom
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button
                @click="editModel(model)"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
              >
                Edit
              </button>
              <button
                @click="deleteModel(model)"
                :disabled="model.isSystem"
                :class="[
                  'text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300',
                  model.isSystem && 'opacity-50 cursor-not-allowed'
                ]"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <ModelFormModal
      v-if="showAddModal || editingModel"
      :is-open="showAddModal || !!editingModel"
      :model="editingModel"
      @close="closeModal"
      @saved="handleModelSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import type { AIModel } from '@susai/types'
import ModelFormModal from '~/components/ModelFormModal.vue'

// Set page title
useHead({
  title: 'Model Manager - Sustainable AI Dashboard'
})

// State
const models = ref<AIModel[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showAddModal = ref(false)
const editingModel = ref<AIModel | null>(null)

// API URL
const apiUrl = process.env.NUXT_PUBLIC_API_URL || 'https://localhost:3001'

// Fetch models from API
const fetchModels = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`${apiUrl}/api/models`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch models')
    }

    const data = await response.json()
    if (data.success && data.data) {
      models.value = data.data
    } else {
      throw new Error('Invalid response format')
    }
  } catch (err) {
    console.error('Error fetching models:', err)
    error.value = err instanceof Error ? err.message : 'Failed to fetch models'
  } finally {
    loading.value = false
  }
}

// Edit model
const editModel = (model: AIModel) => {
  editingModel.value = { ...model }
  showAddModal.value = false
}

// Delete model
const deleteModel = async (model: AIModel) => {
  if (model.isSystem) {
    alert('System models cannot be deleted')
    return
  }

  if (!confirm(`Are you sure you want to delete "${model.name}"?`)) {
    return
  }

  try {
    const response = await fetch(`${apiUrl}/api/models/${model.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to delete model')
    }

    await fetchModels()
  } catch (err) {
    console.error('Error deleting model:', err)
    alert(err instanceof Error ? err.message : 'Failed to delete model')
  }
}

// Close modal
const closeModal = () => {
  showAddModal.value = false
  editingModel.value = null
}

// Handle model saved
const handleModelSaved = () => {
  closeModal()
  fetchModels()
}

// Load models on mount
onMounted(() => {
  fetchModels()
})
</script>

