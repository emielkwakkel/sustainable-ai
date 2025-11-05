<template>
  <div v-if="summary" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Summary</h2>
      <div class="flex gap-2">
        <button
          @click="showMultiplierModal = true"
          class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Cost Multipliers
        </button>
        <button
          @click="showCustomCostModal = true"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Custom Costs
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Token Counts -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Token Counts</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Input Tokens:</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ summary.total_input_tokens.toLocaleString() }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Output Tokens:</span>
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ summary.total_output_tokens.toLocaleString() }}
            </span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            Input Tokens includes all past answers from previous rounds and the initial prompt
          </div>
        </div>
      </div>

      <!-- Costs -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Costs</h3>
        <div class="space-y-4">
          <!-- Default Models -->
          <div v-for="model in defaultModels" :key="model.id" class="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ model.name }}</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Input:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ model.pricing.input }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getBaseCost(model, 'input')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getAdjustedCost(model, 'input')) }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Output:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ model.pricing.output }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getBaseCost(model, 'output')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getAdjustedCost(model, 'output')) }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getBaseCost(model, 'total')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getAdjustedCost(model, 'total')) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Custom Costs (additive) -->
          <div v-for="(customCost, index) in customCosts" :key="`custom-${index}`" class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ customCost.name }}</h4>
              <button
                @click="removeCustomCost(index)"
                class="text-red-500 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Input:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ customCost.inputCost }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getCustomBaseCost(customCost, 'input')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getCustomCost(customCost, 'input')) }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Output:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ customCost.outputCost }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getCustomBaseCost(customCost, 'output')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getCustomCost(customCost, 'output')) }}
                  </span>
                </div>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <div class="flex items-center gap-2">
                  <span v-if="multiplier > 1" class="text-xs text-gray-500 dark:text-gray-400">
                    ${{ formatCost(getCustomBaseCost(customCost, 'total')) }} × {{ multiplier }} =
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    ${{ formatCost(getCustomCost(customCost, 'total')) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CostMultiplierModal
      :is-open="showMultiplierModal"
      :frequency-per-hour="frequencyPerHour"
      :hours="hours"
      :multiplier="multiplier"
      @close="showMultiplierModal = false"
      @update:frequency-per-hour="frequencyPerHour = $event"
      @update:hours="hours = $event"
    />

    <CustomCostModal
      :is-open="showCustomCostModal"
      :model-name="newCustomCostName"
      :input-cost="newCustomInputCost"
      :output-cost="newCustomOutputCost"
      @close="closeCustomCostModal"
      @add="addCustomCost"
      @update:model-name="newCustomCostName = $event"
      @update:input-cost="newCustomInputCost = $event"
      @update:output-cost="newCustomOutputCost = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import type { ChatSummary } from '@susai/types'
import { modelPricing } from '@susai/config'
import CostMultiplierModal from './CostMultiplierModal.vue'
import CustomCostModal from './CustomCostModal.vue'

const props = defineProps<{
  summary?: ChatSummary
}>()

// Cost multipliers (not stored)
const frequencyPerHour = ref<number | null>(null)
const hours = ref<number | null>(null)
const showMultiplierModal = ref(false)

// Custom costs (not stored, additive)
interface CustomCost {
  name: string
  inputCost: number
  outputCost: number
}
const customCosts = ref<CustomCost[]>([])
const showCustomCostModal = ref(false)
const newCustomCostName = ref('')
const newCustomInputCost = ref<number | null>(null)
const newCustomOutputCost = ref<number | null>(null)

// Pricing from config
const gpt35Pricing = modelPricing.find(p => p.model === 'gpt-3.5-turbo') || { input: 0.50, output: 1.50 }
const gpt4oPricing = modelPricing.find(p => p.model === 'gpt-4o') || { input: 2.50, output: 10 }
const gpt41Pricing = modelPricing.find(p => p.model === 'gpt-4.1') || { input: 2, output: 8 }
const gpt5Pricing = modelPricing.find(p => p.model === 'gpt-5') || { input: 1.25, output: 10 }

// Default models configuration
interface ModelConfig {
  id: string
  name: string
  pricing: { input: number; output: number }
  inputCost: number | string | undefined
  outputCost: number | string | undefined
  totalCost: number | string | undefined
}

const defaultModels = computed<ModelConfig[]>(() => [
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    pricing: gpt35Pricing,
    inputCost: props.summary?.gpt35_input_cost,
    outputCost: props.summary?.gpt35_output_cost,
    totalCost: props.summary?.gpt35_total_cost
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    pricing: gpt4oPricing,
    inputCost: props.summary?.gpt4o_input_cost,
    outputCost: props.summary?.gpt4o_output_cost,
    totalCost: props.summary?.gpt4o_total_cost
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    pricing: gpt41Pricing,
    inputCost: props.summary?.gpt41_input_cost,
    outputCost: props.summary?.gpt41_output_cost,
    totalCost: props.summary?.gpt41_total_cost
  },
  {
    id: 'gpt-5',
    name: 'GPT-5',
    pricing: gpt5Pricing,
    inputCost: props.summary?.gpt5_input_cost,
    outputCost: props.summary?.gpt5_output_cost,
    totalCost: props.summary?.gpt5_total_cost
  }
])

// Calculate multiplier
const multiplier = computed(() => {
  return (frequencyPerHour.value || 1) * (hours.value || 1)
})

// Format cost helper
const formatCost = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '0.000000'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0.000000'
  return numValue.toFixed(6)
}

// Get base cost (before multiplier) for default models
const getBaseCost = (model: ModelConfig, type: 'input' | 'output' | 'total'): number => {
  if (!props.summary) return 0
  
  const cost = type === 'input' ? model.inputCost : type === 'output' ? model.outputCost : model.totalCost
  const base = typeof cost === 'string' ? parseFloat(cost) : (cost || 0)
  return isNaN(base) ? 0 : base
}

// Get adjusted cost (with multiplier) for default models
const getAdjustedCost = (model: ModelConfig, type: 'input' | 'output' | 'total'): number => {
  return getBaseCost(model, type) * multiplier.value
}

// Get base cost (before multiplier) for custom costs
const getCustomBaseCost = (customCost: CustomCost, type: 'input' | 'output' | 'total'): number => {
  if (!props.summary) return 0
  
  const inputTokens = typeof props.summary.total_input_tokens === 'string' 
    ? parseFloat(props.summary.total_input_tokens) 
    : (props.summary.total_input_tokens || 0)
  const outputTokens = typeof props.summary.total_output_tokens === 'string'
    ? parseFloat(props.summary.total_output_tokens)
    : (props.summary.total_output_tokens || 0)
  
  if (type === 'input') {
    return (inputTokens / 1_000_000) * customCost.inputCost
  } else if (type === 'output') {
    return (outputTokens / 1_000_000) * customCost.outputCost
  } else {
    const inputCost = (inputTokens / 1_000_000) * customCost.inputCost
    const outputCost = (outputTokens / 1_000_000) * customCost.outputCost
    return inputCost + outputCost
  }
}

// Get custom cost (with multiplier)
const getCustomCost = (customCost: CustomCost, type: 'input' | 'output' | 'total'): number => {
  return getCustomBaseCost(customCost, type) * multiplier.value
}

const addCustomCost = () => {
  if (!newCustomCostName.value || newCustomInputCost.value === null || newCustomOutputCost.value === null) return
  
  customCosts.value.push({
    name: newCustomCostName.value,
    inputCost: newCustomInputCost.value,
    outputCost: newCustomOutputCost.value
  })
  
  closeCustomCostModal()
}

const closeCustomCostModal = () => {
  newCustomCostName.value = ''
  newCustomInputCost.value = null
  newCustomOutputCost.value = null
  showCustomCostModal.value = false
}

const removeCustomCost = (index: number) => {
  customCosts.value.splice(index, 1)
}
</script>
