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
          <!-- GPT-4o -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPT-4o</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Input:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt4oPricing.input }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt4o_input_cost, gpt4oPricing.input, 'input', 'gpt-4o')) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Output:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt4oPricing.output }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt4o_output_cost, gpt4oPricing.output, 'output', 'gpt-4o')) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt4o_total_cost, null, 'total', 'gpt-4o')) }}
                </span>
              </div>
            </div>
          </div>
          <!-- GPT-4.1 -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPT-4.1</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Input:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt41Pricing.input }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt41_input_cost, gpt41Pricing.input, 'input', 'gpt-4.1')) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Output:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt41Pricing.output }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt41_output_cost, gpt41Pricing.output, 'output', 'gpt-4.1')) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt41_total_cost, null, 'total', 'gpt-4.1')) }}
                </span>
              </div>
            </div>
          </div>
          <!-- GPT-5 -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPT-5</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Input:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt5Pricing.input }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt5_input_cost, gpt5Pricing.input, 'input', 'gpt-5')) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600 dark:text-gray-400">Output:</span>
                  <div class="relative group">
                    <Info class="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-help" />
                    <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                      <div class="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 shadow-lg whitespace-nowrap">
                        ${{ gpt5Pricing.output }} / 1M tokens
                      </div>
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt5_output_cost, gpt5Pricing.output, 'output', 'gpt-5')) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getAdjustedCost(summary.gpt5_total_cost, null, 'total', 'gpt-5')) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Custom Costs (additive) -->
          <div v-for="(customCost, index) in customCosts" :key="index" class="border-t border-gray-200 dark:border-gray-700 pt-4">
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
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getCustomCost(customCost, 'input')) }}
                </span>
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
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getCustomCost(customCost, 'output')) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(getCustomCost(customCost, 'total')) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost Multiplier Modal -->
    <div v-if="showMultiplierModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" @click="showMultiplierModal = false"></div>
        <div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Cost Multipliers</h3>
            <button @click="showMultiplierModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency per hour</label>
              <input
                v-model.number="frequencyPerHour"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hours</label>
              <input
                v-model.number="hours"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 8"
              />
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Multiplier: <span class="font-semibold">{{ multiplier }}x</span> ({{ frequencyPerHour || 1 }} × {{ hours || 1 }})
            </p>
            <div class="flex justify-end gap-2 pt-4">
              <button
                @click="showMultiplierModal = false"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Cost Modal -->
    <div v-if="showCustomCostModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" @click="showCustomCostModal = false"></div>
        <div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Custom Cost</h3>
            <button @click="showCustomCostModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model Name</label>
              <input
                v-model="newCustomCostName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Custom Model"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input Cost ($ per 1M tokens)</label>
              <input
                v-model.number="newCustomInputCost"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5.00"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Cost ($ per 1M tokens)</label>
              <input
                v-model.number="newCustomOutputCost"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15.00"
              />
            </div>
            <div class="flex justify-end gap-2 pt-4">
              <button
                @click="showCustomCostModal = false"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                @click="addCustomCost"
                :disabled="!newCustomCostName || !newCustomInputCost || !newCustomOutputCost"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info, X } from 'lucide-vue-next'
import type { ChatSummary } from '@susai/types'
import { modelPricing } from '@susai/config'

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
const gpt4oPricing = modelPricing.find(p => p.model === 'gpt-4o') || { input: 2.50, output: 10 }
const gpt41Pricing = modelPricing.find(p => p.model === 'gpt-4.1') || { input: 2, output: 8 }
const gpt5Pricing = modelPricing.find(p => p.model === 'gpt-5') || { input: 1.25, output: 10 }

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

// Get adjusted cost based on multipliers (for default models)
const getAdjustedCost = (
  baseCost: number | string | undefined,
  defaultPricing: number | null,
  type: 'input' | 'output' | 'total',
  model: 'gpt-4o' | 'gpt-4.1' | 'gpt-5' = 'gpt-4o'
): number => {
  if (!props.summary) return 0
  
  const base = typeof baseCost === 'string' ? parseFloat(baseCost) : (baseCost || 0)
  if (isNaN(base)) return 0
  
  // Apply multiplier
  return base * multiplier.value
}

// Get custom cost (for additive custom models)
const getCustomCost = (customCost: CustomCost, type: 'input' | 'output' | 'total'): number => {
  if (!props.summary) return 0
  
  const inputTokens = typeof props.summary.total_input_tokens === 'string' 
    ? parseFloat(props.summary.total_input_tokens) 
    : (props.summary.total_input_tokens || 0)
  const outputTokens = typeof props.summary.total_output_tokens === 'string'
    ? parseFloat(props.summary.total_output_tokens)
    : (props.summary.total_output_tokens || 0)
  
  if (type === 'input') {
    const cost = (inputTokens / 1_000_000) * customCost.inputCost
    return cost * multiplier.value
  } else if (type === 'output') {
    const cost = (outputTokens / 1_000_000) * customCost.outputCost
    return cost * multiplier.value
  } else {
    const inputCost = (inputTokens / 1_000_000) * customCost.inputCost
    const outputCost = (outputTokens / 1_000_000) * customCost.outputCost
    return (inputCost + outputCost) * multiplier.value
  }
}

const addCustomCost = () => {
  if (!newCustomCostName.value || newCustomInputCost.value === null || newCustomOutputCost.value === null) return
  
  customCosts.value.push({
    name: newCustomCostName.value,
    inputCost: newCustomInputCost.value,
    outputCost: newCustomOutputCost.value
  })
  
  newCustomCostName.value = ''
  newCustomInputCost.value = null
  newCustomOutputCost.value = null
  showCustomCostModal.value = false
}

const removeCustomCost = (index: number) => {
  customCosts.value.splice(index, 1)
}
</script>
