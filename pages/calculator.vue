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
        <!-- Presets Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Presets</h2>
          
          <div class="space-y-4">
            <!-- Preset Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Load Preset
              </label>
              <div class="flex gap-2">
                <select
                  v-model="selectedPresetId"
                  @change="loadPreset"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a preset...</option>
                  <optgroup label="Default Presets">
                    <option v-for="preset in defaultPresets" :key="preset.id" :value="preset.id">
                      {{ preset.name }}
                    </option>
                  </optgroup>
                  <optgroup v-if="customPresets.length > 0" label="Custom Presets">
                    <option v-for="preset in customPresets" :key="preset.id" :value="preset.id">
                      {{ preset.name }}
                    </option>
                  </optgroup>
                </select>
                <button
                  @click="clearPresetSelection"
                  class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
              <p v-if="selectedPreset" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ selectedPreset.description }}
              </p>
            </div>

            <!-- Save Current Configuration -->
            <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
              <div class="flex gap-2">
                <input
                  v-model="newPresetName"
                  type="text"
                  placeholder="Preset name"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  @click="saveCurrentAsPreset"
                  :disabled="!newPresetName.trim()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
              <input
                v-model="newPresetDescription"
                type="text"
                placeholder="Description (optional)"
                class="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <!-- Custom Presets Management -->
            <div v-if="customPresets.length > 0" class="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Custom Presets</h3>
              <div class="space-y-2">
                <div v-for="preset in customPresets" :key="preset.id" class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ preset.name }}</p>
                    <p v-if="preset.description" class="text-xs text-gray-500 dark:text-gray-400">{{ preset.description }}</p>
                  </div>
                  <button
                    @click="deleteCustomPreset(preset.id)"
                    class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
          
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
                max="1000000"
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

            <!-- Data Center Selection -->
            <div>
              <label for="dataCenter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Center Region
              </label>
              <select
                id="dataCenter"
                v-model="formData.dataCenter"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option v-for="dataCenter in dataCenterConfigs" :key="dataCenter.id" :value="dataCenter.id">
                  {{ dataCenter.name }} ({{ dataCenter.region }})
                </option>
              </select>
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
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use custom PUE</span>
                  </label>
                  <input
                    v-if="useCustomPue"
                    v-model.number="formData.customPue"
                    type="number"
                    step="0.1"
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
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Use custom carbon intensity</span>
                  </label>
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
                    {{ formatNumber(calculationResult.energyJoules) }}
                  </p>
                  <p class="text-sm text-blue-700 dark:text-blue-300">Joules</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {{ formatNumber(calculationResult.energyKWh, 6) }}
                  </p>
                  <p class="text-sm text-blue-700 dark:text-blue-300">kWh</p>
                </div>
              </div>
            </div>

            <!-- Carbon Emissions -->
            <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 class="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Carbon Emissions</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-200">
                    {{ formatNumber(calculationResult.carbonEmissionsGrams, 4) }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300">g CO₂ per token</p>
                </div>
                <div>
                  <p class="text-2xl font-bold text-red-900 dark:text-red-200">
                    {{ formatNumber(calculationResult.totalEmissionsGrams, 2) }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300">g CO₂ total</p>
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
                    {{ formatNumber(calculationResult.equivalentLightbulbMinutes, 1) }} minutes
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
                    {{ formatNumber(calculationResult.equivalentTreeHours, 1) }} hours
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
import { Calculator, Trash2 } from 'lucide-vue-next'
import type { TokenCalculatorFormData, CalculationResult, TokenCalculatorPreset } from '~/types/watttime'

// Set page title
useHead({
  title: 'Token Calculator - Sustainable AI Dashboard'
})

// Composables
const { 
  aiModels, 
  hardwareConfigs, 
  dataCenterConfigs, 
  calculateEmissions, 
  validateFormData,
  formatNumber 
} = useTokenCalculator()

const {
  presets,
  defaultPresets,
  customPresets,
  savePreset,
  loadPreset: loadPresetConfig,
  deletePreset,
  exportPresets,
  importPresets
} = usePresets()

// State
const formData = ref<TokenCalculatorFormData>({
  tokenCount: 1000,
  model: 'gpt-4',
  contextLength: 8000,
  contextWindow: 1250,
  hardware: 'nvidia-a100',
  dataCenter: 'google-korea'
})

const calculationResult = ref<CalculationResult | null>(null)
const isCalculating = ref(false)
const useCustomPue = ref(false)
const useCustomCarbonIntensity = ref(false)

// Preset state
const selectedPresetId = ref('')
const selectedPreset = ref<TokenCalculatorPreset | null>(null)
const newPresetName = ref('')
const newPresetDescription = ref('')

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

// Preset methods
const loadPreset = () => {
  if (!selectedPresetId.value) {
    selectedPreset.value = null
    return
  }

  const configuration = loadPresetConfig(selectedPresetId.value)
  if (configuration) {
    formData.value = { ...configuration }
    selectedPreset.value = presets.value.find((p: TokenCalculatorPreset) => p.id === selectedPresetId.value) || null
  }
}

const clearPresetSelection = () => {
  selectedPresetId.value = ''
  selectedPreset.value = null
}

const saveCurrentAsPreset = () => {
  if (!newPresetName.value.trim()) return

  const id = savePreset(
    newPresetName.value.trim(),
    newPresetDescription.value.trim(),
    { ...formData.value }
  )

  // Clear the form
  newPresetName.value = ''
  newPresetDescription.value = ''

  // Show success message (you could add a toast notification here)
  console.log('Preset saved successfully')
}

const deleteCustomPreset = (id: string) => {
  if (confirm('Are you sure you want to delete this preset?')) {
    const success = deletePreset(id)
    if (success) {
      // Clear selection if the deleted preset was selected
      if (selectedPresetId.value === id) {
        clearPresetSelection()
      }
    }
  }
}

// Auto-update context fields when model changes
watch(() => formData.value.model, (newModel) => {
  const selectedModel = aiModels.find(model => model.id === newModel)
  if (selectedModel) {
    formData.value.contextLength = selectedModel.contextLength
    formData.value.contextWindow = selectedModel.contextWindow
  }
})

// Auto-calculate when form data changes
watch(formData, () => {
  if (formData.value.tokenCount > 0) {
    calculate()
  }
}, { deep: true })
</script>