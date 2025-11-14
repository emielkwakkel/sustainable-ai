<template>
  <div class="space-y-4">
    <!-- Token Input Mode Toggle -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Token Input Mode *
      </label>
      <div class="flex gap-4">
        <label class="flex items-center">
          <input
            type="radio"
            v-model="localUseDetailedTokens"
            :value="false"
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Total Tokens</span>
        </label>
        <label class="flex items-center">
          <input
            type="radio"
            v-model="localUseDetailedTokens"
            :value="true"
            class="mr-2"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Detailed Breakdown</span>
        </label>
      </div>
    </div>

    <!-- Token Count (Simple Mode) -->
    <div v-if="!localUseDetailedTokens">
      <label for="tokenCount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Number of Tokens
      </label>
      <input
        id="tokenCount"
        :value="formData.tokenCount"
        @input="updateField('tokenCount', $event)"
        type="number"
        min="1"
        max="5000000000"
        :required="!localUseDetailedTokens"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter number of tokens"
      />
    </div>

    <!-- Detailed Token Breakdown -->
    <div v-if="localUseDetailedTokens" class="space-y-3">
      <div>
        <label for="inputWithCache" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input (w/ Cache Write)
        </label>
        <input
          id="inputWithCache"
          :value="formData.inputWithCache || 0"
          @input="updateField('inputWithCache', $event)"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
        />
      </div>
      <div>
        <label for="inputWithoutCache" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Input (w/o Cache Write)
        </label>
        <input
          id="inputWithoutCache"
          :value="formData.inputWithoutCache || 0"
          @input="updateField('inputWithoutCache', $event)"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
        />
      </div>
      <div>
        <label for="cacheRead" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cache Read
        </label>
        <input
          id="cacheRead"
          :value="formData.cacheRead || 0"
          @input="updateField('cacheRead', $event)"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
        />
      </div>
      <div>
        <label for="outputTokens" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output Tokens
        </label>
        <input
          id="outputTokens"
          :value="formData.outputTokens || 0"
          @input="updateField('outputTokens', $event)"
          type="number"
          min="0"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="0"
        />
      </div>
      
      <!-- Token Weights Display -->
      <div v-if="selectedModelWeights" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Token Weights ({{ formData.model }})</p>
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>Input (w/ Cache): {{ selectedModelWeights.inputWithCache }}×</div>
          <div>Input (w/o Cache): {{ selectedModelWeights.inputWithoutCache }}×</div>
          <div>Cache Read: {{ selectedModelWeights.cacheRead }}×</div>
          <div>Output: {{ selectedModelWeights.outputTokens }}×</div>
        </div>
      </div>

      <!-- Weighted Token Count Display -->
      <div v-if="weightedTokenCount > 0" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Weighted Token Count: <span class="font-bold">{{ Math.round(weightedTokenCount) }}</span>
        </p>
      </div>
    </div>

    <!-- Model Selection -->
    <div>
      <label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        AI Model
      </label>
      <select
        id="model"
        :value="formData.model"
        @change="updateField('model', $event)"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option v-for="model in aiModels" :key="model.id" :value="model.id">
          {{ model.name }}
        </option>
      </select>
    </div>

    <!-- Context Window -->
    <div>
      <label for="contextWindow" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Context Window (tokens) *
      </label>
      <input
        id="contextWindow"
        :value="formData.contextWindow"
        @input="updateField('contextWindow', $event)"
        type="number"
        :min="100"
        :max="selectedModelContextLength || 2000"
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        :class="{ 'border-red-500 dark:border-red-500': contextWindowError }"
        placeholder="Enter context window size"
      />
      <p v-if="selectedModelContextLength" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Maximum for selected model: {{ selectedModelContextLength.toLocaleString() }} tokens
      </p>
      <p v-if="contextWindowError" class="text-xs text-red-600 dark:text-red-400 mt-1">
        {{ contextWindowError }}
      </p>
    </div>

    <!-- Hardware Selection -->
    <div>
      <label for="hardware" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Hardware Type
      </label>
      <select
        id="hardware"
        :value="formData.hardware"
        @change="updateField('hardware', $event)"
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
        :value="formData.dataCenterProvider"
        @change="updateField('dataCenterProvider', $event)"
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
        :value="formData.dataCenterRegion"
        @change="updateField('dataCenterRegion', $event)"
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
              v-model="localUseCustomPue"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Override PUE</span>
          </label>
          <div v-if="!localUseCustomPue && selectedRegionPue" class="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Using region PUE: <span class="font-medium">{{ selectedRegionPue }}</span>
            </p>
          </div>
          <input
            v-if="localUseCustomPue"
            :value="formData.customPue"
            @input="updateField('customPue', $event)"
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
              v-model="localUseCustomCarbonIntensity"
              type="checkbox"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Override carbon intensity</span>
          </label>
          <div v-if="!localUseCustomCarbonIntensity && selectedRegionCarbonIntensity" class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p class="text-sm text-green-700 dark:text-green-300">
              Using region carbon intensity: <span class="font-medium">{{ selectedRegionCarbonIntensity }} kg CO₂/kWh</span>
            </p>
          </div>
          <input
            v-if="localUseCustomCarbonIntensity"
            :value="formData.customCarbonIntensity"
            @input="updateField('customCarbonIntensity', $event)"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { TokenCalculatorFormData } from '~/types/watttime'
import { useTokenCalculator } from '~/composables/useTokenCalculator'

interface Props {
  formData: TokenCalculatorFormData
  useDetailedTokens?: boolean
  useCustomPue?: boolean
  useCustomCarbonIntensity?: boolean
  contextWindowError?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  useDetailedTokens: false,
  useCustomPue: false,
  useCustomCarbonIntensity: false,
  contextWindowError: null
})

const emit = defineEmits<{
  'update:formData': [value: TokenCalculatorFormData]
  'update:useDetailedTokens': [value: boolean]
  'update:useCustomPue': [value: boolean]
  'update:useCustomCarbonIntensity': [value: boolean]
}>()

// Composables
const {
  aiModels,
  hardwareConfigs,
  dataCenterProviders,
  getRegionsForProvider,
  getPueForRegion,
  getCarbonIntensityForRegion,
  calculateWeightedTokens
} = useTokenCalculator()

// Local state for internal toggles
const localUseDetailedTokens = ref(props.useDetailedTokens)
const localUseCustomPue = ref(props.useCustomPue)
const localUseCustomCarbonIntensity = ref(props.useCustomCarbonIntensity)

// Watch props and sync local state
watch(() => props.useDetailedTokens, (val) => { 
  if (localUseDetailedTokens.value !== val) {
    localUseDetailedTokens.value = val 
  }
}, { immediate: true })
watch(() => props.useCustomPue, (val) => { 
  if (localUseCustomPue.value !== val) {
    localUseCustomPue.value = val 
  }
}, { immediate: true })
watch(() => props.useCustomCarbonIntensity, (val) => { 
  if (localUseCustomCarbonIntensity.value !== val) {
    localUseCustomCarbonIntensity.value = val 
  }
}, { immediate: true })

// Watch local state and emit changes
watch(localUseDetailedTokens, (val) => {
  if (props.useDetailedTokens !== val) {
    emit('update:useDetailedTokens', val)
  }
})
watch(localUseCustomPue, (val) => {
  if (props.useCustomPue !== val) {
    emit('update:useCustomPue', val)
  }
})
watch(localUseCustomCarbonIntensity, (val) => {
  if (props.useCustomCarbonIntensity !== val) {
    emit('update:useCustomCarbonIntensity', val)
  }
})

// Computed properties
const selectedModelWeights = computed(() => {
  if (!props.formData.model) return null
  const model = aiModels.value.find(m => m.id === props.formData.model || m.name === props.formData.model)
  return model?.tokenWeights || null
})

const selectedModelContextLength = computed(() => {
  if (!props.formData.model) return null
  const model = aiModels.value.find(m => m.id === props.formData.model || m.name === props.formData.model)
  return model?.contextLength || null
})

const weightedTokenCount = computed(() => {
  if (!localUseDetailedTokens.value || !props.formData.model) return 0
  return calculateWeightedTokens(
    props.formData.inputWithCache || 0,
    props.formData.inputWithoutCache || 0,
    props.formData.cacheRead || 0,
    props.formData.outputTokens || 0,
    props.formData.model
  )
})

const availableRegions = computed(() => {
  return getRegionsForProvider(props.formData.dataCenterProvider)
})

const selectedRegionPue = computed(() => {
  return getPueForRegion(props.formData.dataCenterProvider, props.formData.dataCenterRegion)
})

const selectedRegionCarbonIntensity = computed(() => {
  return getCarbonIntensityForRegion(props.formData.dataCenterProvider, props.formData.dataCenterRegion)
})

// Methods
const updateField = (field: keyof TokenCalculatorFormData, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  let value: any
  
  if (target.type === 'number') {
    value = target.value === '' ? undefined : parseFloat(target.value) || 0
  } else {
    value = target.value
  }
  
  emit('update:formData', {
    ...props.formData,
    [field]: value
  })
}
</script>

