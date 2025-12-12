<template>
  <!-- Preset Button -->
  <button
    @click="openPopup"
    class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
  >
    <Settings class="w-4 h-4" />
    Presets
  </button>

  <!-- Popup Overlay -->
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="closePopup"
  >
    <!-- Popup Content -->
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Preset Manager</h2>
        <button
          @click="closePopup"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Save Current Configuration -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Save Current Configuration</h3>
          <div class="space-y-3">
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Presets List -->
        <div v-if="presets.length > 0" class="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Presets</h3>
          <div class="space-y-2">
            <div 
              v-for="preset in presets" 
              :key="preset.id" 
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              @click="loadPreset(preset.id)"
            >
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ preset.name }}</p>
                <p v-if="preset.description" class="text-xs text-gray-500 dark:text-gray-400">{{ preset.description }}</p>
              </div>
              <button
                v-if="!preset.isSystem"
                @click.stop="deleteCustomPreset(preset.id)"
                :disabled="loading"
                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 disabled:opacity-50"
              >
                <Trash2 class="w-4 h-4" />
              </button>
              <span v-else class="text-xs text-gray-400 dark:text-gray-500 px-2">System</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="closePopup"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Settings, X, Trash2 } from 'lucide-vue-next'
import type { TokenCalculatorFormData, TokenCalculatorPreset } from '~/types/watttime'
import { usePresets } from '~/composables/usePresets'

interface Props {
  currentConfiguration: TokenCalculatorFormData
}

interface Emits {
  (e: 'preset-loaded', configuration: TokenCalculatorFormData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const {
  presets,
  savePreset,
  loadPreset: loadPresetConfig,
  deletePreset,
  initialize,
  loading,
  error
} = usePresets()

// Initialize presets on mount
onMounted(() => {
  initialize()
})

// State
const isOpen = ref(false)
const newPresetName = ref('')
const newPresetDescription = ref('')

// Methods
const openPopup = () => {
  isOpen.value = true
}

const closePopup = () => {
  isOpen.value = false
  // Clear form when closing
  newPresetName.value = ''
  newPresetDescription.value = ''
}

const loadPreset = (presetId: string) => {
  const configuration = loadPresetConfig(presetId)
  if (configuration) {
    emit('preset-loaded', configuration)
    closePopup()
  }
}

const saveCurrentAsPreset = async () => {
  if (!newPresetName.value.trim()) return

  try {
    await savePreset(
      newPresetName.value.trim(),
      newPresetDescription.value.trim(),
      { ...props.currentConfiguration }
    )

    // Clear the form
    newPresetName.value = ''
    newPresetDescription.value = ''

    // Show success message (you could add a toast notification here)
    console.log('Preset saved successfully')
  } catch (err) {
    console.error('Failed to save preset:', err)
    alert('Failed to save preset. Please try again.')
  }
}

const deleteCustomPreset = async (id: string) => {
  const preset = presets.value.find(p => p.id === id)
  
  // Prevent deletion of system presets
  if (preset?.isSystem) {
    alert('Cannot delete system presets.')
    return
  }
  
  if (confirm('Are you sure you want to delete this preset?')) {
    const success = await deletePreset(id)
    if (!success) {
      alert('Failed to delete preset. Please try again.')
    }
  }
}
</script>
