<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Edit Calculation</h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div v-if="calculation" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Token Count
          </label>
          <input
            v-model.number="formData.token_count"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Model
          </label>
          <input
            v-model="formData.model"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context Length
            </label>
            <input
              v-model.number="formData.context_length"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context Window
            </label>
            <input
              v-model.number="formData.context_window"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            @click="saveCalculation"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
            <span v-else>Save & Recalculate</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Calculation } from '~/types/watttime'

interface Props {
  calculation: Calculation | null
  projectId: string
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formData = ref({
  token_count: 0,
  model: '',
  context_length: 0,
  context_window: 0,
  hardware: '',
  data_center_provider: '',
  data_center_region: '',
})

const saving = ref(false)

watch(() => props.calculation, (newCalc) => {
  if (newCalc) {
    formData.value = {
      token_count: newCalc.token_count,
      model: newCalc.model,
      context_length: newCalc.context_length || 0,
      context_window: newCalc.context_window || 0,
      hardware: newCalc.hardware || '',
      data_center_provider: newCalc.data_center_provider || '',
      data_center_region: newCalc.data_center_region || '',
    }
  }
}, { immediate: true })

const saveCalculation = async () => {
  if (!props.calculation) return

  saving.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    
    // Update the calculation fields
    const updateResponse = await fetch(`${apiBaseUrl}/api/calculations/${props.calculation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token_count: formData.value.token_count,
        model: formData.value.model,
        context_length: formData.value.context_length,
        context_window: formData.value.context_window,
        hardware: formData.value.hardware,
        data_center_provider: formData.value.data_center_provider,
        data_center_region: formData.value.data_center_region,
        user_id: 'default-user',
      }),
    })

    const updateData = await updateResponse.json()
    if (updateData.success) {
      // Then recalculate with new parameters
      await fetch(`${apiBaseUrl}/api/calculations/${props.calculation.id}/recalculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'default-user',
        }),
      })

      emit('updated')
    }
  } catch (error) {
    console.error('Error updating calculation:', error)
  } finally {
    saving.value = false
  }
}
</script>

