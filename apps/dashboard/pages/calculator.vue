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
            <!-- Token Count -->
            <div>
              <label for="tokenCount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number of Tokens
              </label>
              <input
                id="tokenCount"
                v-model.number="formData.tokenCount"
                type="number"
                min="1"
                max="5000000000"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter number of tokens"
              />
            </div>

            <!-- Model Selection -->
            <div>
              <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                AI Model
              </label>
              <select
                id="model"
                v-model="formData.model"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option v-for="model in aiModels" :key="model.id" :value="model.id">
                  {{ model.name }}
                </option>
              </select>
            </div>

            <!-- Context Length -->
            <div>
              <label for="contextLength" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Context Length (tokens)
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(auto-set from model, can be overridden)</span>
              </label>
              <input
                id="contextLength"
                v-model.number="formData.contextLength"
                type="number"
                min="1000"
                max="32000"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Context Window -->
            <div>
              <label for="contextWindow" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Context Window (tokens)
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(auto-set from model, can be overridden)</span>
              </label>
              <input
                id="contextWindow"
                v-model.number="formData.contextWindow"
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
                <option v-for="hardware in hardwareConfigs" :key="hardware.id" :value="hardware.id">
                  {{ hardware.name }}
                </option>
              </select>
            </div>

            <!-- Data Center Provider Selection -->
            <div>
              <label for="dataCenterProvider" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Center Provider
              </label>
              <select
                id="dataCenterProvider"
                v-model="formData.dataCenterProvider"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option v-for="provider in dataCenterProviders" :key="provider.id" :value="provider.id">
                  {{ provider.name }}
                </option>
              </select>
            </div>

            <!-- Data Center Region Selection -->
            <div>
              <label for="dataCenterRegion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Center Region
              </label>
              <select
                id="dataCenterRegion"
                v-model="formData.dataCenterRegion"
                :disabled="!formData.dataCenterProvider"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Select a region...</option>
                <option v-for="region in availableRegions" :key="region.id" :value="region.id">
                  {{ region.name }} ({{ region.region }})
                </option>
              </select>
              <p v-if="selectedRegionPue" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PUE: {{ selectedRegionPue }} | Carbon Intensity: {{ selectedRegionCarbonIntensity }} kg CO₂/kWh
              </p>
            </div>

            <!-- Advanced Options -->
            <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Advanced Options</h3>
              
              <div class="space-y-4">
                <div>
                  <label class="flex items-center">
                    <input
                      v-model="useCustomPue"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Override PUE</span>
                  </label>
                  <div v-if="!useCustomPue && selectedRegionPue" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                      Using region PUE: <span class="font-medium">{{ selectedRegionPue }}</span>
                    </p>
                  </div>
                  <input
                    v-if="useCustomPue"
                    v-model.number="formData.customPue"
                    type="number"
                    step="0.01"
                    min="1.0"
                    max="3.0"
                    class="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PUE (1.0 - 3.0)"
                  />
                </div>

                <div>
                  <label class="flex items-center">
                    <input
                      v-model="useCustomCarbonIntensity"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Override carbon intensity</span>
                  </label>
                  <div v-if="!useCustomCarbonIntensity && selectedRegionCarbonIntensity" class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p class="text-sm text-green-700 dark:text-green-300">
                      Using region carbon intensity: <span class="font-medium">{{ selectedRegionCarbonIntensity }} kg CO₂/kWh</span>
                    </p>
                  </div>
                  <input
                    v-if="useCustomCarbonIntensity"
                    v-model.number="formData.customCarbonIntensity"
                    type="number"
                    step="0.001"
                    min="0.0"
                    max="1.0"
                    class="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="kg CO₂/kWh (0.0 - 1.0)"
                  />
                </div>
              </div>
            </div>

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
        <div v-if="calculationResult" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
          
          <div class="space-y-4">
            <!-- Energy Results -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 class="text-lg font-medium text-blue-900 dark:text-blue-200 mb-2">Energy Consumption</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {{ formatEnergyJoules(calculationResult.energyJoules) }}
                  </p>
                  <p class="text-sm text-blue-700 dark:text-blue-300">Energy</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {{ formatEnergyWh(calculationResult.energyJoules) }}
                  </p>
                  <p class="text-sm text-blue-700 dark:text-blue-300">Energy</p>
                </div>
              </div>
            </div>

            <!-- Carbon Emissions -->
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 class="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Carbon Emissions</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-200">
                    {{ formatCO2(calculationResult.carbonEmissionsGrams, 4) }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300">per token</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-200">
                    {{ formatCO2(calculationResult.totalEmissionsGrams, 2) }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300">total</p>
                </div>
              </div>
            </div>

            <!-- Comparison Metrics -->
            <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h3 class="text-lg font-medium text-green-900 dark:text-green-200 mb-2">Equivalent To</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-green-700 dark:text-green-300">Lightbulb (10W):</span>
                  <span class="font-medium text-green-900 dark:text-green-200">
                    {{ formatDuration(calculationResult.equivalentLightbulbMinutes) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700 dark:text-green-300">Car miles:</span>
                  <span class="font-medium text-green-900 dark:text-green-200">
                    {{ formatNumber(calculationResult.equivalentCarMiles, 2) }} miles
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-green-700 dark:text-green-300">Tree absorption:</span>
                  <span class="font-medium text-green-900 dark:text-green-200">
                    {{ formatDuration(calculationResult.equivalentTreeHours * 60) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Export Button -->
            <button
              @click="exportResults"
              class="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Export Results
            </button>
          </div>
        </div>

        <!-- Default State -->
        <div v-else class="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick } from 'vue'
import { Calculator } from 'lucide-vue-next'
import type { TokenCalculatorFormData, CalculationResult, AIModel } from '~/types/watttime'
import { useTokenCalculator } from '~/composables/useTokenCalculator'
import { formatEnergyJoules, formatEnergyWh, formatCO2, formatDuration } from '~/utils/formatting'

// Set page title
useHead({
  title: 'Token Calculator - Sustainable AI Dashboard'
})

// Composables
const { 
  aiModels, 
  hardwareConfigs, 
  dataCenterProviders,
  getRegionsForProvider,
  getPueForRegion,
  getCarbonIntensityForRegion,
  calculateEmissions, 
  validateFormData,
  formatNumber 
} = useTokenCalculator()

// Removed preset composable - now handled by PresetManager component

// State
const formData = ref<TokenCalculatorFormData>({
  tokenCount: 1000,
  model: 'gpt-4',
  contextLength: 8000,
  contextWindow: 1250,
  hardware: 'nvidia-a100',
  dataCenterProvider: 'aws',
  dataCenterRegion: 'aws-asia-pacific-tokyo'
})

const calculationResult = ref<CalculationResult | null>(null)
const isCalculating = ref(false)
const isLoadingPreset = ref(false)
const useCustomPue = ref(false)
const useCustomCarbonIntensity = ref(false)

// Computed properties for data center regions
const availableRegions = computed(() => {
  return getRegionsForProvider(formData.value.dataCenterProvider)
})

const selectedRegionPue = computed(() => {
  return getPueForRegion(formData.value.dataCenterProvider, formData.value.dataCenterRegion)
})

const selectedRegionCarbonIntensity = computed(() => {
  return getCarbonIntensityForRegion(formData.value.dataCenterProvider, formData.value.dataCenterRegion)
})

// Methods
const calculate = async () => {
  isCalculating.value = true
  
  try {
    // Validate form data
    const validation = validateFormData(formData.value)
    if (!validation.isValid) {
      alert('Please fix the following errors:\n' + validation.errors.join('\n'))
      return
    }

    // Calculate emissions
    const result = calculateEmissions(formData.value)
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

// Auto-update context fields when model changes
watch(() => formData.value.model, (newModel: string) => {
  const selectedModel = aiModels.find((m: AIModel) => m.id === newModel)
  if (selectedModel) {
    formData.value.contextLength = selectedModel.contextLength
    formData.value.contextWindow = selectedModel.contextWindow
  }
})

// Auto-fill PUE when region changes
watch(() => formData.value.dataCenterRegion, (newRegion) => {
  if (newRegion && !useCustomPue.value) {
    const pue = selectedRegionPue.value
    if (pue !== null) {
      formData.value.customPue = pue
    }
  }
})

// Auto-fill carbon intensity when region changes
watch(() => formData.value.dataCenterRegion, (newRegion) => {
  if (newRegion && !useCustomCarbonIntensity.value) {
    const carbonIntensity = selectedRegionCarbonIntensity.value
    if (carbonIntensity !== null) {
      formData.value.customCarbonIntensity = carbonIntensity
    }
  }
})

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
watch(formData, () => {
  if (formData.value.tokenCount > 0 && !isCalculating.value && !isLoadingPreset.value) {
    calculate()
  }
}, { deep: true })
</script>