<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Update Preset & Context Window
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p class="text-sm text-blue-900 dark:text-blue-200">
            Updating <strong>{{ calculationIds.length }}</strong> calculation{{ calculationIds.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preset
          </label>
          <select
            v-model="selectedPresetId"
            @change="handlePresetChange"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="project-default">Project Default</option>
            <option v-for="preset in allPresets" :key="preset.id" :value="preset.id">
              {{ preset.name }} - {{ preset.description }}
            </option>
          </select>
          <p v-if="selectedPreset && selectedPresetId !== 'project-default'" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Model: {{ selectedPreset.configuration.model }}, Context Window: {{ selectedPreset.configuration.contextWindow }}
          </p>
          <p v-else-if="selectedPresetId === 'project-default'" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Using project preset: {{ projectPresetName }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Context Window
            <span class="text-xs text-gray-500 dark:text-gray-400">(leave empty to use preset)</span>
          </label>
          <input
            v-model.number="contextWindow"
            type="number"
            min="1"
            :placeholder="projectPresetContextWindow?.toString() || ''"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-900 dark:text-red-200">{{ error }}</p>
        </div>

        <div class="flex justify-end gap-2 mt-6">
          <button
            @click="$emit('close')"
            :disabled="updating"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleUpdate"
            :disabled="updating"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Loader2 v-if="updating" class="w-4 h-4 animate-spin" />
            <span v-else>Update & Recalculate</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { usePresets } from '~/composables/usePresets'

interface Props {
  calculationIds: string[]
  projectId: string
  projectPresetId?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { presets, initialize: initializePresets } = usePresets()

const getAllPresets = () => presets.value
const getPresetById = (id: string) => presets.value.find(p => p.id === id)

// Initialize presets on mount
onMounted(() => {
  initializePresets()
})

const allPresets = computed(() => getAllPresets())

const selectedPresetId = ref<string>('project-default')
const contextWindow = ref<number | null>(null)
const updating = ref(false)
const error = ref<string | null>(null)
const project = ref<any>(null)

const selectedPreset = computed(() => {
  if (selectedPresetId.value === 'project-default') {
    return null
  }
  return selectedPresetId.value ? getPresetById(selectedPresetId.value) || null : null
})

const projectPreset = computed(() => {
  const presetId = props.projectPresetId || project.value?.calculation_preset_id
  return presetId ? getPresetById(presetId) : null
})

const projectPresetName = computed(() => {
  return projectPreset.value?.name || 'Unknown'
})

const projectPresetContextWindow = computed(() => {
  return projectPreset.value?.configuration.contextWindow
})

// Fetch project to get its preset
onMounted(async () => {
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/projects/${props.projectId}?user_id=default-user`)
    const data = await response.json()
    if (data.success) {
      project.value = data.data.project
    }
  } catch (err) {
    console.error('Error fetching project:', err)
  }
})

const handlePresetChange = () => {
  if (selectedPresetId.value === 'project-default') {
    // Reset context window to null when using project default
    contextWindow.value = null
  } else {
    const preset = selectedPreset.value
    if (preset && contextWindow.value === null) {
      // Set context window to preset value if not manually set
      contextWindow.value = preset.configuration.contextWindow
    }
  }
}

const handleUpdate = async () => {
  if (props.calculationIds.length === 0) return

  updating.value = true
  error.value = null

  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    
    // Determine preset_id to send
    // If 'project-default', send null; otherwise send the preset ID
    const presetId = selectedPresetId.value === 'project-default' ? null : selectedPresetId.value
    
    // Prepare context_window value
    // If contextWindow is null/undefined, send null to use preset default
    // If contextWindow has a value, send that value
    const contextWindowValue = contextWindow.value !== null && contextWindow.value !== undefined
      ? contextWindow.value
      : null

    // Call bulk-update endpoint
    const updateResponse = await fetch(`${apiBaseUrl}/api/calculations/bulk-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: props.calculationIds.map(id => parseInt(id, 10)),
        user_id: 'default-user',
        preset_id: presetId,
        context_window: contextWindowValue,
      }),
    })

    const updateData = await updateResponse.json()
    
    if (!updateData.success) {
      throw new Error(updateData.error || 'Failed to update calculations')
    }

    // After successful update, trigger bulk recalculate
    const recalculateResponse = await fetch(`${apiBaseUrl}/api/calculations/bulk-recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: props.calculationIds.map(id => parseInt(id, 10)),
        user_id: 'default-user',
      }),
    })

    const recalculateData = await recalculateResponse.json()
    
    if (!recalculateData.success) {
      throw new Error(recalculateData.error || 'Failed to recalculate calculations')
    }

    emit('updated')
  } catch (err) {
    console.error('Error updating calculations:', err)
    error.value = err instanceof Error ? err.message : 'Failed to update calculations'
  } finally {
    updating.value = false
  }
}
</script>

