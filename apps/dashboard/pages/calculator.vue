<template>
  <div class="space-y-8">
    <!-- Page Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Token Calculator</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Calculate the carbon emissions and energy consumption of AI model inference
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Input Form -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Configuration</h2>
            <PresetManager 
              :current-configuration="formData"
              @preset-loaded="handlePresetLoaded"
            />
          </div>
          
          <form @submit.prevent="calculate" class="space-y-4">
            <TokenCalculatorForm
              v-model:form-data="formData"
              v-model:use-detailed-tokens="useDetailedTokens"
              v-model:use-custom-pue="useCustomPue"
              v-model:use-custom-carbon-intensity="useCustomCarbonIntensity"
              :context-window-error="contextWindowError"
            />
            
            <!-- Calculate Button -->
            <button
              type="submit"
              :disabled="isCalculating"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span v-if="isCalculating">Calculating...</span>
              <span v-else>Calculate Emissions</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Results Display -->
      <div class="space-y-6">
        <TokenCalculatorResults
          v-if="calculationResult"
          :result="calculationResult"
          @export="exportResults"
        />
        <TokenCalculatorPlaceholder v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, computed } from 'vue'
import type { TokenCalculatorFormData, CalculationResult } from '~/types/watttime'
import { useTokenCalculator } from '~/composables/useTokenCalculator'
import TokenCalculatorForm from '~/components/token-calculator/TokenCalculatorForm.vue'
import TokenCalculatorResults from '~/components/token-calculator/TokenCalculatorResults.vue'
import TokenCalculatorPlaceholder from '~/components/token-calculator/TokenCalculatorPlaceholder.vue'

// Set page title
useHead({
  title: 'Token Calculator - Sustainable AI Dashboard'
})

// Composables
const { 
  aiModels,
  isLoadingModels,
  calculateEmissions, 
  validateFormData,
  formatNumber,
  calculateWeightedTokens
} = useTokenCalculator()

// Removed preset composable - now handled by PresetManager component

// State
const useDetailedTokens = ref(false)
const formData = ref<TokenCalculatorFormData>({
  tokenCount: 1000,
  model: '', // Will be set when models are loaded from API
  contextLength: 0, // Will be set from selected model
  contextWindow: 1250, // User-editable, actual processing amount
  hardware: 'nvidia-a100',
  dataCenterProvider: 'aws',
  dataCenterRegion: 'aws-asia-pacific-tokyo',
  inputWithCache: 0,
  inputWithoutCache: 0,
  cacheRead: 0,
  outputTokens: 0,
  useDetailedTokens: false
})

const calculationResult = ref<CalculationResult | null>(null)
const isCalculating = ref(false)
const isLoadingPreset = ref(false)
const useCustomPue = ref(false)
const useCustomCarbonIntensity = ref(false)
const contextWindowError = ref<string | null>(null)

// Computed: Get selected model's context length (maximum capacity)
const selectedModelContextLength = computed(() => {
  if (!formData.value.model) return null
  const model = aiModels.value.find(m => m.id === formData.value.model || m.name === formData.value.model)
  return model?.contextLength || null
})

// Computed: Calculate weighted token count
const weightedTokenCount = computed(() => {
  if (!useDetailedTokens.value || !formData.value.model) return 0
  return calculateWeightedTokens(
    formData.value.inputWithCache || 0,
    formData.value.inputWithoutCache || 0,
    formData.value.cacheRead || 0,
    formData.value.outputTokens || 0,
    formData.value.model
  )
})

// Methods
const calculate = async () => {
  isCalculating.value = true
  
  try {
    // Prepare form data for validation and calculation
    const formDataForValidation: any = {
      ...formData.value,
      tokenCount: useDetailedTokens.value ? weightedTokenCount.value : formData.value.tokenCount,
      useDetailedTokens: useDetailedTokens.value
    }

    // Only include detailed token fields when using detailed mode
    // Otherwise, set them to undefined so the calculator uses tokenCount
    if (!useDetailedTokens.value) {
      formDataForValidation.inputWithCache = undefined
      formDataForValidation.inputWithoutCache = undefined
      formDataForValidation.cacheRead = undefined
      formDataForValidation.outputTokens = undefined
    }

    // Validate context window doesn't exceed model's context length
    if (contextWindowError.value) {
      alert('Please fix the following error:\n' + contextWindowError.value)
      return
    }

    // Validate form data
    const validation = validateFormData(formDataForValidation)
    if (!validation.isValid) {
      alert('Please fix the following errors:\n' + validation.errors.join('\n'))
      return
    }

    // Calculate emissions
    const result = calculateEmissions(formDataForValidation)
    console.log(result);
    calculationResult.value = result
  } catch (error) {
    console.error('Calculation error:', error)
    alert('An error occurred during calculation. Please try again.')
  } finally {
    isCalculating.value = false
  }
}

const exportResults = () => {
  if (!calculationResult.value) return

  const exportData = {
    configuration: formData.value,
    results: calculationResult.value,
    timestamp: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `token-calculator-results-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Preset handler
const handlePresetLoaded = async (configuration: TokenCalculatorFormData) => {
  // Prevent calculation during preset loading
  isLoadingPreset.value = true
  isCalculating.value = true
  
  try {
    // Store the region value before setting provider (which will reset it)
    const presetRegion = configuration.dataCenterRegion
    
    // Set provider first to update available regions list
    formData.value.dataCenterProvider = configuration.dataCenterProvider
    
    // Wait for next tick to ensure regions list is updated
    await nextTick()
    
    // Set all other values (region will be set separately)
    formData.value = { 
      ...configuration,
      dataCenterRegion: '' // Temporarily set to empty to avoid watcher issues
    }
    
    // Wait another tick to ensure everything is updated, then set the region
    await nextTick()
    formData.value.dataCenterRegion = presetRegion
    
    // Wait one more tick to ensure region is properly set before allowing calculations
    await nextTick()
    
    // Check if preset contains custom values and update checkbox states
    useCustomPue.value = configuration.customPue !== undefined
    useCustomCarbonIntensity.value = configuration.customCarbonIntensity !== undefined
  } finally {
    // Re-enable calculation after preset is fully loaded
    isLoadingPreset.value = false
    isCalculating.value = false
  }
}

// Auto-select first model when models are loaded from API
watch([aiModels, isLoadingModels], ([models, isLoading]) => {
  // Only auto-select if models are loaded, not currently loading, and formData doesn't have a model yet
  if (!isLoading && models.length > 0 && !formData.value.model) {
    const firstModel = models[0]
    if (firstModel) {
      formData.value.model = firstModel.id
      formData.value.contextLength = firstModel.contextLength
    }
  }
}, { immediate: true })

// Auto-update context length when model changes (for validation)
watch(() => formData.value.model, (newModel: string) => {
  if (!newModel) return
  const selectedModel = aiModels.value.find(m => m.id === newModel || m.name === newModel)
  if (selectedModel) {
    // Set context length from model (used for validation, not displayed)
    formData.value.contextLength = selectedModel.contextLength
    // Context window is not auto-set - user must enter it manually per calculation
  }
})

// Validate context window doesn't exceed model's context length
watch([() => formData.value.contextWindow, selectedModelContextLength], ([window, maxLength]) => {
  if (window && maxLength && window > maxLength) {
    contextWindowError.value = `Context window cannot exceed model's maximum capacity of ${maxLength.toLocaleString()} tokens`
  } else {
    contextWindowError.value = null
  }
}, { immediate: true })

// Note: PUE and carbon intensity auto-fill is now handled in TokenCalculatorForm component

// Reset region when provider changes
watch(() => formData.value.dataCenterProvider, () => {
  // Don't reset region if we're loading a preset (preset handler will manage it)
  if (isLoadingPreset.value) return
  
  formData.value.dataCenterRegion = ''
  // Prevent calculation during provider change
  isCalculating.value = true
  nextTick(() => {
    isCalculating.value = false
  })
})

// Auto-calculate when form data changes
watch([formData, useDetailedTokens], () => {
  // Don't calculate if model is not selected yet
  if (!formData.value.model) return
  
  const hasValidInput = useDetailedTokens.value 
    ? (weightedTokenCount.value > 0)
    : (formData.value.tokenCount > 0)
  
  if (hasValidInput && !isCalculating.value && !isLoadingPreset.value) {
    calculate()
  }
}, { deep: true })
</script>