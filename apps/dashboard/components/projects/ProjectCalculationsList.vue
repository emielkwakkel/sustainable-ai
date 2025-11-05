<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Calculations
      </h3>
      <button
        v-if="selectedCalculations.length > 0"
        @click="handleBulkRecalculate"
        :disabled="recalculating"
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
      >
        <Loader2 v-if="recalculating" class="w-4 h-4 animate-spin" />
        <RefreshCw v-else class="w-4 h-4" />
        Recalculate Selected ({{ selectedCalculations.length }})
      </button>
    </div>
    <div class="p-6">
      <div v-if="calculations.length > 0" class="space-y-4">
        <div
          v-for="calculation in calculations"
          :key="calculation.id"
          class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <div class="flex items-center space-x-4">
            <input
              type="checkbox"
              :value="calculation.id"
              v-model="selectedCalculations"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Calculator class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ calculation.token_count.toLocaleString() }} tokens
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ calculation.model }} • {{ formatDate(calculation.created_at) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="font-medium text-red-600 dark:text-red-400">
                {{ formatNumber(calculation.results.totalEmissionsGrams, 3) }}g CO₂
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatNumber(calculation.results.energyJoules / 3600000, 4) }}kWh
              </p>
            </div>
            <button
              @click="handleRecalculate(String(calculation.id))"
              :disabled="recalculating"
              class="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
              title="Recalculate"
            >
              <Loader2 v-if="recalculating" class="w-4 h-4 animate-spin" />
              <RefreshCw v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        <Calculator class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No calculations yet</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Calculator, RefreshCw, Loader2 } from 'lucide-vue-next'
import type { Calculation } from '~/types/watttime'

interface Props {
  calculations: readonly Calculation[]
}

interface Emits {
  (e: 'recalculated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedCalculations = ref<string[]>([])
const recalculating = ref(false)

const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const handleRecalculate = async (calculationId: string) => {
  recalculating.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/${calculationId}/recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'default-user', // TODO: Get from auth
      }),
    })

    const data = await response.json()
    if (data.success) {
      emit('recalculated')
    }
  } catch (error) {
    console.error('Error recalculating:', error)
  } finally {
    recalculating.value = false
  }
}

const handleBulkRecalculate = async () => {
  if (selectedCalculations.value.length === 0) return

  recalculating.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/calculations/bulk-recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: selectedCalculations.value.map(id => parseInt(id)),
        user_id: 'default-user', // TODO: Get from auth
      }),
    })

    const data = await response.json()
    if (data.success) {
      selectedCalculations.value = []
      emit('recalculated')
    }
  } catch (error) {
    console.error('Error bulk recalculating:', error)
  } finally {
    recalculating.value = false
  }
}
</script>

