<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Add Calculation
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Token Count -->
          <div>
            <label for="token_count" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Tokens *
            </label>
            <input
              id="token_count"
              v-model.number="formData.token_count"
              type="number"
              min="1"
              max="1000000"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter number of tokens"
            />
          </div>

          <!-- Model Selection -->
          <div>
            <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI Model *
            </label>
            <select
              id="model"
              v-model="formData.model"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a model</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="llama-2-70b">Llama 2 70B</option>
            </select>
          </div>

          <!-- Context Length -->
          <div>
            <label for="context_length" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Length (tokens)
            </label>
            <input
              id="context_length"
              v-model.number="formData.context_length"
              type="number"
              min="1000"
              max="32000"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Context Window -->
          <div>
            <label for="context_window" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Window (tokens)
            </label>
            <input
              id="context_window"
              v-model.number="formData.context_window"
              type="number"
              min="100"
              max="2000"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Hardware Selection -->
          <div>
            <label for="hardware" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hardware Type
            </label>
            <select
              id="hardware"
              v-model="formData.hardware"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="nvidia-a100">NVIDIA A100</option>
              <option value="nvidia-v100">NVIDIA V100</option>
              <option value="nvidia-h100">NVIDIA H100</option>
            </select>
          </div>

          <!-- Data Center Provider -->
          <div>
            <label for="data_center_provider" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Center Provider
            </label>
            <select
              id="data_center_provider"
              v-model="formData.data_center_provider"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="aws">Amazon Web Services</option>
              <option value="google-cloud">Google Cloud</option>
              <option value="azure">Microsoft Azure</option>
            </select>
          </div>

          <!-- Data Center Region -->
          <div>
            <label for="data_center_region" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Center Region
            </label>
            <select
              id="data_center_region"
              v-model="formData.data_center_region"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="aws-us-east">AWS US East (N. Virginia)</option>
              <option value="aws-us-west">AWS US West (Oregon)</option>
              <option value="google-oregon">Google Cloud Oregon</option>
              <option value="google-iowa">Google Cloud Iowa</option>
            </select>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
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
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="loading">Adding...</span>
              <span v-else>Add Calculation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useTokenCalculator } from '~/composables/useTokenCalculator'
import { usePresets } from '~/composables/usePresets'

// Props
interface Props {
  projectId: string
  projectPresetId?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  created: []
}>()

// Composables
const { calculateEmissions, validateFormData } = useTokenCalculator()
const { presets, loadPreset } = usePresets()

// Helper function
const getPresetConfiguration = (presetId: string) => {
  return loadPreset(presetId)
}

// State
const formData = ref({
  token_count: 1000,
  model: 'gpt-4',
  context_length: 8000,
  context_window: 1250,
  hardware: 'nvidia-a100',
  data_center_provider: 'aws',
  data_center_region: 'aws-us-east'
})

// Initialize form with project preset if available
if (props.projectPresetId) {
  const presetConfig = getPresetConfiguration(props.projectPresetId)
  if (presetConfig) {
    formData.value = {
      token_count: presetConfig.tokenCount,
      model: presetConfig.model,
      context_length: presetConfig.contextLength,
      context_window: presetConfig.contextWindow,
      hardware: presetConfig.hardware,
      data_center_provider: presetConfig.dataCenterProvider,
      data_center_region: presetConfig.dataCenterRegion
    }
  }
}

const loading = ref(false)
const error = ref<string | null>(null)

// Methods
const handleSubmit = async () => {
  if (!formData.value.token_count || formData.value.token_count < 1) {
    error.value = 'Token count must be at least 1'
    return
  }

  if (!formData.value.model) {
    error.value = 'Model selection is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Validate form data
    const validation = validateFormData({
      tokenCount: formData.value.token_count,
      model: formData.value.model,
      contextLength: formData.value.context_length,
      contextWindow: formData.value.context_window,
      hardware: formData.value.hardware,
      dataCenterProvider: formData.value.data_center_provider,
      dataCenterRegion: formData.value.data_center_region
    })

    if (!validation.isValid) {
      error.value = validation.errors.join(', ')
      return
    }

    // Calculate emissions
    const results = calculateEmissions({
      tokenCount: formData.value.token_count,
      model: formData.value.model,
      contextLength: formData.value.context_length,
      contextWindow: formData.value.context_window,
      hardware: formData.value.hardware,
      dataCenterProvider: formData.value.data_center_provider,
      dataCenterRegion: formData.value.data_center_region
    })

    // Add calculation to project
    const response = await fetch('/api/calculations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: props.projectId,
        token_count: formData.value.token_count,
        model: formData.value.model,
        context_length: formData.value.context_length,
        context_window: formData.value.context_window,
        hardware: formData.value.hardware,
        data_center_provider: formData.value.data_center_provider,
        data_center_region: formData.value.data_center_region,
        results: results,
        user_id: 'default-user' // TODO: Get from auth
      })
    })
    const data = await response.json()

    if (data.success) {
      // Reset form
      formData.value = {
        token_count: 1000,
        model: 'gpt-4',
        context_length: 8000,
        context_window: 1250,
        hardware: 'nvidia-a100',
        data_center_provider: 'aws',
        data_center_region: 'aws-us-east'
      }

      // Emit success
      emit('created')
    } else {
      throw new Error(data.error || 'Failed to add calculation')
    }
  } catch (err) {
    console.error('Error adding calculation:', err)
    error.value = err instanceof Error ? err.message : 'Failed to add calculation'
  } finally {
    loading.value = false
  }
}
</script>
