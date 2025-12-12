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
          <TokenCalculatorForm
            v-model:form-data="calculatorFormData"
            v-model:use-detailed-tokens="useDetailedTokens"
            v-model:use-custom-pue="useCustomPue"
            v-model:use-custom-carbon-intensity="useCustomCarbonIntensity"
            :context-window-error="contextWindowError"
          />

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
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { TokenCalculatorFormData } from '~/types/watttime'
import { useTokenCalculator } from '~/composables/useTokenCalculator'
import { usePresets } from '~/composables/usePresets'
import { useProject } from '~/composables/useProject'
import TokenCalculatorForm from '~/components/token-calculator/TokenCalculatorForm.vue'

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
const { calculateEmissions, validateFormData, calculateWeightedTokens, aiModels, isLoadingModels } = useTokenCalculator()
const { presets, loadPreset, initialize } = usePresets()
const { addCalculation } = useProject(props.projectId)

// Initialize presets on mount
onMounted(() => {
  initialize()
})

// Helper function
const getPresetConfiguration = (presetId: string) => {
  return loadPreset(presetId)
}

// State
const useDetailedTokens = ref(false)
const useCustomPue = ref(false)
const useCustomCarbonIntensity = ref(false)
const contextWindowError = ref<string | null>(null)

// Calculator form data (camelCase format)
const calculatorFormData = ref<TokenCalculatorFormData>({
  tokenCount: 1000,
  model: '', // Will be set when models are loaded from API
  contextLength: 0, // Will be set from selected model
  contextWindow: 1250,
  hardware: 'nvidia-a100',
  dataCenterProvider: 'aws',
  dataCenterRegion: 'aws-us-east',
  inputWithCache: 0,
  inputWithoutCache: 0,
  cacheRead: 0,
  outputTokens: 0,
  useDetailedTokens: false
})

// Legacy form data (snake_case format) - computed from calculatorFormData for API compatibility
const formData = computed({
  get: () => ({
    token_count: calculatorFormData.value.tokenCount,
    model: calculatorFormData.value.model,
    context_length: calculatorFormData.value.contextLength,
    context_window: calculatorFormData.value.contextWindow,
    hardware: calculatorFormData.value.hardware,
    data_center_provider: calculatorFormData.value.dataCenterProvider,
    data_center_region: calculatorFormData.value.dataCenterRegion,
    input_with_cache: calculatorFormData.value.inputWithCache || 0,
    input_without_cache: calculatorFormData.value.inputWithoutCache || 0,
    cache_read: calculatorFormData.value.cacheRead || 0,
    output_tokens: calculatorFormData.value.outputTokens || 0
  }),
  set: (val) => {
    calculatorFormData.value = {
      tokenCount: val.token_count,
      model: val.model,
      contextLength: val.context_length,
      contextWindow: val.context_window,
      hardware: val.hardware,
      dataCenterProvider: val.data_center_provider,
      dataCenterRegion: val.data_center_region,
      inputWithCache: val.input_with_cache || 0,
      inputWithoutCache: val.input_without_cache || 0,
      cacheRead: val.cache_read || 0,
      outputTokens: val.output_tokens || 0,
      useDetailedTokens: useDetailedTokens.value
    }
  }
})

// Initialize form with project preset if available
if (props.projectPresetId) {
  const presetConfig = getPresetConfiguration(props.projectPresetId)
  if (presetConfig) {
    calculatorFormData.value = {
      ...presetConfig,
      inputWithCache: 0,
      inputWithoutCache: 0,
      cacheRead: 0,
      outputTokens: 0,
      useDetailedTokens: useDetailedTokens.value
    }
  }
}

// Auto-select first model when models are loaded from API
watch([aiModels, isLoadingModels], ([models, isLoading]) => {
  // Only auto-select if models are loaded, not currently loading, and formData doesn't have a model yet
  if (!isLoading && models.length > 0 && !calculatorFormData.value.model) {
    const firstModel = models[0]
    if (firstModel) {
      calculatorFormData.value.model = firstModel.id
      calculatorFormData.value.contextLength = firstModel.contextLength
    }
  }
}, { immediate: true })

// Auto-update context length when model changes
watch(() => calculatorFormData.value.model, (newModel: string) => {
  if (!newModel) return
  const selectedModel = aiModels.value.find(m => m.id === newModel || m.name === newModel)
  if (selectedModel) {
    calculatorFormData.value.contextLength = selectedModel.contextLength
  }
})

// Watch for context window validation
watch([() => calculatorFormData.value.contextWindow, () => calculatorFormData.value.contextLength], ([window, maxLength]) => {
  if (window && maxLength && window > maxLength) {
    contextWindowError.value = `Context window cannot exceed model's maximum capacity of ${maxLength.toLocaleString()} tokens`
  } else {
    contextWindowError.value = null
  }
}, { immediate: true })

const loading = ref(false)
const error = ref<string | null>(null)

// Methods
const handleSubmit = async () => {
  if (!useDetailedTokens.value && (!formData.value.token_count || formData.value.token_count < 1)) {
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
    // Calculate total token count (sum of four fields) if detailed breakdown is used
    // token_count should always be the sum, not weighted tokens
    const totalTokenCount = useDetailedTokens.value 
      ? (formData.value.input_with_cache || 0) +
        (formData.value.input_without_cache || 0) +
        (formData.value.cache_read || 0) +
        (formData.value.output_tokens || 0)
      : formData.value.token_count

    // Prepare form data for validation and calculation
    // Core engine will calculate weighted tokens internally when detailed breakdown is provided
    const formDataForValidation: any = {
      tokenCount: totalTokenCount, // Use total tokens (sum), core will calculate weighted internally
      model: formData.value.model,
      contextLength: formData.value.context_length,
      contextWindow: formData.value.context_window,
      hardware: formData.value.hardware,
      dataCenterProvider: formData.value.data_center_provider,
      dataCenterRegion: formData.value.data_center_region,
      useDetailedTokens: useDetailedTokens.value
    }

    if (useDetailedTokens.value) {
      formDataForValidation.inputWithCache = formData.value.input_with_cache
      formDataForValidation.inputWithoutCache = formData.value.input_without_cache
      formDataForValidation.cacheRead = formData.value.cache_read
      formDataForValidation.outputTokens = formData.value.output_tokens
    }

    // Validate form data
    const validation = validateFormData(formDataForValidation)

    if (!validation.isValid) {
      error.value = validation.errors.join(', ')
      return
    }

    // Calculate emissions using core package
    const results = calculateEmissions(formDataForValidation)

    // Prepare calculation data for API (using useProject composable)
    const calculationData: any = {
      token_count: totalTokenCount,
      model: formData.value.model,
      context_length: formData.value.context_length,
      context_window: formData.value.context_window,
      hardware: formData.value.hardware,
      data_center_provider: formData.value.data_center_provider,
      data_center_region: formData.value.data_center_region,
      results: results
    }

    // Add calculation parameters if detailed breakdown was used
    if (useDetailedTokens.value && results.weightedTokens !== undefined) {
      calculationData.calculation_parameters = {
        weightedTokens: results.weightedTokens
      }
    }

    // Add detailed token fields if using detailed mode
    if (useDetailedTokens.value) {
      calculationData.cache_read = formData.value.cache_read || null
      calculationData.output_tokens = formData.value.output_tokens || null
      calculationData.input_with_cache = formData.value.input_with_cache || null
      calculationData.input_without_cache = formData.value.input_without_cache || null
    }

    // Add custom PUE and carbon intensity if provided
    if (useCustomPue.value && calculatorFormData.value.customPue !== undefined) {
      calculationData.custom_pue = calculatorFormData.value.customPue
    }
    if (useCustomCarbonIntensity.value && calculatorFormData.value.customCarbonIntensity !== undefined) {
      calculationData.custom_carbon_intensity = calculatorFormData.value.customCarbonIntensity
    }

    // Add calculation to project using useProject composable
    await addCalculation(calculationData)

    // Reset form
    useDetailedTokens.value = false
    calculatorFormData.value = {
      tokenCount: 1000,
      model: '', // Will be set when models are loaded from API
      contextLength: 0, // Will be set from selected model
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenterProvider: 'aws',
      dataCenterRegion: 'aws-us-east',
      inputWithCache: 0,
      inputWithoutCache: 0,
      cacheRead: 0,
      outputTokens: 0,
      useDetailedTokens: false
    }

    // Emit success
    emit('created')
  } catch (err) {
    console.error('Error adding calculation:', err)
    error.value = err instanceof Error ? err.message : 'Failed to add calculation'
  } finally {
    loading.value = false
  }
}
</script>

