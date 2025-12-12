<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ model ? 'Edit Model' : 'Add New Model' }}
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Name *
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., GPT-4"
            />
          </div>

          <!-- Parameters -->
          <div>
            <label for="parameters" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Parameters (billions) *
            </label>
            <input
              id="parameters"
              v-model.number="formData.parameters"
              type="number"
              required
              min="1"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 280"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Complexity factor will be auto-calculated: {{ complexityFactor.toFixed(4) }}
            </p>
          </div>

          <!-- Context Length -->
          <div>
            <label for="contextLength" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Length (Maximum Capacity) *
            </label>
            <input
              id="contextLength"
              v-model.number="formData.contextLength"
              type="number"
              required
              min="1"
              step="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 8000"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Maximum number of tokens this model can process. Context window (actual processing amount) is set per calculation.
            </p>
          </div>

          <!-- Token Weights (Optional) -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Token Weights (Optional)
              </label>
              <button
                type="button"
                @click="useDefaultTokenWeights"
                class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Use Defaults
              </button>
            </div>
            <div v-if="formData.tokenWeights" class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Input (w/ Cache)</label>
                <input
                  v-model.number="formData.tokenWeights.inputWithCache"
                  type="number"
                  step="0.0001"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1.25"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Input (w/o Cache)</label>
                <input
                  v-model.number="formData.tokenWeights.inputWithoutCache"
                  type="number"
                  step="0.0001"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1.00"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cache Read</label>
                <input
                  v-model.number="formData.tokenWeights.cacheRead"
                  type="number"
                  step="0.0001"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.10"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Output Tokens</label>
                <input
                  v-model.number="formData.tokenWeights.outputTokens"
                  type="number"
                  step="0.0001"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="5.00"
                />
              </div>
            </div>
            <button
              v-if="formData.tokenWeights"
              type="button"
              @click="clearTokenWeights"
              class="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Clear token weights
            </button>
          </div>

          <!-- Pricing (Optional) -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pricing (Optional) - Price per 1M tokens
              </label>
              <div class="flex gap-2">
                <button
                  v-if="!formData.pricing"
                  type="button"
                  @click="formData.pricing = { input: 0, cachedInput: 0, output: 0 }"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Add Pricing
                </button>
                <button
                  v-if="formData.pricing"
                  type="button"
                  @click="clearPricing"
                  class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear pricing
                </button>
              </div>
            </div>
            <div v-if="formData.pricing" class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Input</label>
                <input
                  v-model.number="formData.pricing.input"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cached Input</label>
                <input
                  v-model.number="formData.pricing.cachedInput"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Output</label>
                <input
                  v-model.number="formData.pricing.output"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="loading">Saving...</span>
              <span v-else>{{ model ? 'Update' : 'Create' }} Model</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { AIModel, CreateModelRequest, UpdateModelRequest, TokenWeights, ModelPricing } from '@susai/types'

const props = defineProps<{
  isOpen: boolean
  model?: AIModel | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

// API URL
const apiUrl = process.env.NUXT_PUBLIC_API_URL || 'https://localhost:3001'

// Default token weights
const defaultTokenWeights: TokenWeights = {
  inputWithCache: 1.25,
  inputWithoutCache: 1.00,
  cacheRead: 0.10,
  outputTokens: 5.00
}

// Form data
const formData = ref<{
  name: string
  parameters: number | null
  contextLength: number | null
  tokenWeights: TokenWeights | null
  pricing: ModelPricing | null
}>({
  name: '',
  parameters: null,
  contextLength: null,
  tokenWeights: null,
  pricing: null
})

const loading = ref(false)
const error = ref<string | null>(null)

// Computed complexity factor
const complexityFactor = computed(() => {
  if (!formData.value.parameters) return 0
  return formData.value.parameters / 175.0
})

// Watch for model changes
watch(() => props.model, (newModel) => {
  if (newModel) {
    formData.value = {
      name: newModel.name,
      parameters: newModel.parameters,
      contextLength: newModel.contextLength,
      tokenWeights: newModel.tokenWeights ? { ...newModel.tokenWeights } : null,
      pricing: newModel.pricing ? { ...newModel.pricing } : null
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// Reset form
const resetForm = () => {
  formData.value = {
    name: '',
    parameters: null,
    contextLength: null,
    tokenWeights: null,
    pricing: null
  }
  error.value = null
}

// Use default token weights
const useDefaultTokenWeights = () => {
  formData.value.tokenWeights = { ...defaultTokenWeights }
}

// Clear token weights
const clearTokenWeights = () => {
  formData.value.tokenWeights = null
}

// Clear pricing
const clearPricing = () => {
  formData.value.pricing = null
}

// Handle submit
const handleSubmit = async () => {
  if (!formData.value.name || !formData.value.parameters || !formData.value.contextLength) {
    error.value = 'Please fill in all required fields'
    return
  }

  if (formData.value.parameters <= 0 || formData.value.contextLength <= 0) {
    error.value = 'Parameters and context length must be positive numbers'
    return
  }

  loading.value = true
  error.value = null

  try {
    const payload: CreateModelRequest | UpdateModelRequest = {
      name: formData.value.name,
      parameters: formData.value.parameters,
      contextLength: formData.value.contextLength,
      // Context window is set per calculation, not per model
      tokenWeights: formData.value.tokenWeights || undefined,
      pricing: formData.value.pricing || undefined
    }

    const url = props.model 
      ? `${apiUrl}/api/models/${props.model.id}`
      : `${apiUrl}/api/models`
    
    const method = props.model ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save model')
    }

    emit('saved')
  } catch (err) {
    console.error('Error saving model:', err)
    error.value = err instanceof Error ? err.message : 'Failed to save model'
  } finally {
    loading.value = false
  }
}
</script>

