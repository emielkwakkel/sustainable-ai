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
        <!-- Preset Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Load Preset
          </label>
          <div class="flex gap-2">
            <select
              v-model="selectedPresetId"
              @change="updateSelectedPreset"
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

        <!-- Custom Presets Management -->
        <div v-if="customPresets.length > 0" class="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Custom Presets</h3>
          <div class="space-y-2">
            <div v-for="preset in customPresets" :key="preset.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ preset.name }}</p>
                <p v-if="preset.description" class="text-xs text-gray-500 dark:text-gray-400">{{ preset.description }}</p>
              </div>
              <button
                @click="deleteCustomPreset(preset.id)"
                class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Import/Export -->
        <div class="border-t border-gray-200 dark:border-gray-600 pt-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Import/Export</h3>
          <div class="flex gap-2">
            <button
              @click="handleExportPresets"
              class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Download class="w-4 h-4" />
              Export
            </button>
            <label class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              <Upload class="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                @change="handleImportPresets"
                class="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="loadPreset"
          :disabled="!selectedPresetId"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Load Preset
        </button>
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
import { Settings, X, Trash2, Download, Upload } from 'lucide-vue-next'
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
  defaultPresets,
  customPresets,
  savePreset,
  loadPreset: loadPresetConfig,
  deletePreset,
  exportPresets,
  importPresets
} = usePresets()

// State
const isOpen = ref(false)
const selectedPresetId = ref('')
const selectedPreset = ref<TokenCalculatorPreset | null>(null)
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

const updateSelectedPreset = () => {
  if (!selectedPresetId.value) {
    selectedPreset.value = null
    return
  }
  
  selectedPreset.value = presets.value.find((p: TokenCalculatorPreset) => p.id === selectedPresetId.value) || null
}

const loadPreset = () => {
  if (!selectedPresetId.value) {
    return
  }

  const configuration = loadPresetConfig(selectedPresetId.value)
  if (configuration) {
    emit('preset-loaded', configuration)
    closePopup()
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
    { ...props.currentConfiguration }
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

const handleExportPresets = () => {
  // Check if there are custom presets to export
  if (customPresets.value.length === 0) {
    alert('No custom presets to export. Create some custom presets first.')
    return
  }
  
  const exportData = exportPresets()
  
  // Create a blob with the JSON data
  const blob = new Blob([exportData], { type: 'application/json' })
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob)
  
  // Create a temporary anchor element to trigger download
  const link = document.createElement('a')
  link.href = url
  link.download = `token-calculator-presets-${new Date().toISOString().split('T')[0]}.json`
  
  // Trigger the download
  document.body.appendChild(link)
  link.click()
  
  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  console.log('Presets exported successfully')
}

const handleImportPresets = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        const success = importPresets(content)
        if (success) {
          console.log('Presets imported successfully')
          // You could add a toast notification here
        } else {
          console.error('Failed to import presets')
          alert('Failed to import presets. Please check the file format.')
        }
      }
    }
    reader.readAsText(file)
    
    // Reset the file input so the same file can be selected again
    target.value = ''
  }
}
</script>
