<template>
  <div v-if="summary" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
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
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Input:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt4o_input_cost) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Output:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt4o_output_cost) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt4o_total_cost) }}
                </span>
              </div>
            </div>
          </div>
          <!-- GPT-4.1 -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPT-4.1</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Input:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt41_input_cost) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Output:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt41_output_cost) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt41_total_cost) }}
                </span>
              </div>
            </div>
          </div>
          <!-- GPT-5 -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GPT-5</h4>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Input:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt5_input_cost) }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Output:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt5_output_cost) }}
                </span>
              </div>
              <div class="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                <span class="font-semibold text-gray-900 dark:text-white">
                  ${{ formatCost(summary.gpt5_total_cost) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatSummary } from '@susai/types'

defineProps<{
  summary?: ChatSummary
}>()

// Format cost helper - converts string/number to formatted string
const formatCost = (value: number | string | undefined): string => {
  if (value === undefined || value === null) return '0.000000'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0.000000'
  return numValue.toFixed(6)
}
</script>

