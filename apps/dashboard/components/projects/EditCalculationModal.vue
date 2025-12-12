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
        <!-- Token Input Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token Input Mode
          </label>
          <div class="flex gap-4">
            <label class="flex items-center">
              <input
                type="radio"
                v-model="useDetailedTokens"
                :value="false"
                class="mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Total Tokens</span>
            </label>
            <label class="flex items-center">
              <input
                type="radio"
                v-model="useDetailedTokens"
                :value="true"
                class="mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Detailed Breakdown</span>
            </label>
          </div>
        </div>

        <!-- Token Count (Simple Mode) -->
        <div v-if="!useDetailedTokens">
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

        <!-- Detailed Token Breakdown -->
        <div v-if="useDetailedTokens" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Input (w/ Cache Write)
            </label>
            <input
              v-model.number="formData.input_with_cache"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Input (w/o Cache Write)
            </label>
            <input
              v-model.number="formData.input_without_cache"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cache Read
            </label>
            <input
              v-model.number="formData.cache_read"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Output Tokens
            </label>
            <input
              v-model.number="formData.output_tokens"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>
          
          <!-- Total Token Count (Read-only, calculated) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Token Count (sum)
            </label>
            <input
              :value="totalTokenCount"
              type="number"
              readonly
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          
          <!-- Weighted Token Count (Read-only, calculated) -->
          <div v-if="weightedTokenCount > 0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Weighted Token Count (for calculation)
            </label>
            <input
              :value="Math.round(weightedTokenCount)"
              type="number"
              readonly
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 cursor-not-allowed"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This value will be used for emissions calculation
            </p>
          </div>
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
            v-model.number="formData.context_window"
            type="number"
            min="1"
            :placeholder="projectPresetContextWindow?.toString() || ''"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
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
import { ref, watch, computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Calculation } from '~/types/watttime'
import { usePresets } from '~/composables/usePresets'
import { useTokenCalculator } from '~/composables/useTokenCalculator'

interface Props {
  calculation: Calculation | null
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
const { calculateWeightedTokens } = useTokenCalculator()

const getAllPresets = () => presets.value
const getPresetById = (id: string) => presets.value.find(p => p.id === id)

// Initialize presets on mount
onMounted(() => {
  initializePresets()
})

const allPresets = computed(() => getAllPresets())

const formData = ref({
  token_count: 0,
  model: '',
  context_window: null as number | null,
  hardware: '',
  data_center_provider: '',
  data_center_region: '',
  input_with_cache: 0,
  input_without_cache: 0,
  cache_read: 0,
  output_tokens: 0,
})

const selectedPresetId = ref<string>('project-default')
const saving = ref(false)
const project = ref<any>(null)
// Default to detailed breakdown mode to show all fields
const useDetailedTokens = ref(true)

// Check if calculation has detailed token breakdown (at least one field > 0)
const hasDetailedTokens = computed(() => {
  if (!props.calculation) return false
  return (
    (props.calculation.input_with_cache !== null && props.calculation.input_with_cache !== undefined && props.calculation.input_with_cache > 0) ||
    (props.calculation.input_without_cache !== null && props.calculation.input_without_cache !== undefined && props.calculation.input_without_cache > 0) ||
    (props.calculation.cache_read !== null && props.calculation.cache_read !== undefined && props.calculation.cache_read > 0) ||
    (props.calculation.output_tokens !== null && props.calculation.output_tokens !== undefined && props.calculation.output_tokens > 0)
  )
})

// Calculate total token count (sum of four fields)
const totalTokenCount = computed(() => {
  if (!useDetailedTokens.value) return formData.value.token_count
  return (formData.value.input_with_cache || 0) +
         (formData.value.input_without_cache || 0) +
         (formData.value.cache_read || 0) +
         (formData.value.output_tokens || 0)
})

// Calculate weighted token count
const weightedTokenCount = computed(() => {
  if (!useDetailedTokens.value || !formData.value.model) return 0
  return calculateWeightedTokens(
    formData.value.input_with_cache || 0,
    formData.value.input_without_cache || 0,
    formData.value.cache_read || 0,
    formData.value.output_tokens || 0,
    formData.value.model
  )
})

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
  } catch (error) {
    console.error('Error fetching project:', error)
  }
})

// Find preset ID from calculation's model and context values, or use project preset
const findPresetForCalculation = (calc: Calculation): string => {
  // If context_window is NULL, calculation is using project preset defaults
  if (calc.context_window === null || calc.context_window === undefined) {
    return 'project-default'
  }
  
  // Get project preset for comparison
  const projectPresetId = props.projectPresetId || project.value?.calculation_preset_id
  const projectPresetConfig = projectPresetId ? getPresetById(projectPresetId) : null
  
  // If we have context_window, try to match to a preset
  // Check all presets (including project preset) to find the best match
  if (calc.context_window !== null && calc.context_window !== undefined) {
    
    // First, check if values match project preset exactly
    if (projectPresetConfig) {
      const matchesProjectPreset = 
        calc.model === projectPresetConfig.configuration.model &&
        calc.context_window === projectPresetConfig.configuration.contextWindow &&
        (calc.hardware || '') === (projectPresetConfig.configuration.hardware || '') &&
        (calc.data_center_provider || '') === (projectPresetConfig.configuration.dataCenterProvider || '') &&
        (calc.data_center_region || '') === (projectPresetConfig.configuration.dataCenterRegion || '')
      
      if (matchesProjectPreset) {
        return 'project-default'
      }
    }
    
    // Try to find a matching preset by checking all fields
    // Priority: exact match on all fields > match on model + context window > match on context window only
    const matchingPreset = allPresets.value.find(preset => {
      const config = preset.configuration
      return config.model === calc.model &&
             config.contextWindow === calc.context_window &&
             (config.hardware || '') === (calc.hardware || '') &&
             (config.dataCenterProvider || '') === (calc.data_center_provider || '') &&
             (config.dataCenterRegion || '') === (calc.data_center_region || '')
    })
    
    if (matchingPreset) {
      return matchingPreset.id
    }
    
    // Fallback: match on model + context window only (in case hardware/data center were manually changed)
    const fallbackPreset = allPresets.value.find(preset => {
      const config = preset.configuration
      return config.model === calc.model &&
             config.contextWindow === calc.context_window
    })
    
    if (fallbackPreset) {
      return fallbackPreset.id
    }
  }
  
  // Default to project preset if no match found
  return 'project-default'
}

watch(() => props.calculation, (newCalc) => {
  if (newCalc) {
    // Debug: Check what we're receiving
    console.log('EditCalculationModal - Received calculation:', {
      id: newCalc.id,
      input_with_cache: newCalc.input_with_cache,
      input_without_cache: newCalc.input_without_cache,
      cache_read: newCalc.cache_read,
      output_tokens: newCalc.output_tokens,
      hasInputWithCache: 'input_with_cache' in newCalc,
      hasInputWithoutCache: 'input_without_cache' in newCalc,
      hasCacheRead: 'cache_read' in newCalc,
      hasOutputTokens: 'output_tokens' in newCalc,
    })
    
    // Always show detailed breakdown mode by default
    // Load all data from database, using 0 as default for null/undefined values
    // Handle both null and undefined explicitly
    const inputWithCache = (newCalc.input_with_cache != null) ? newCalc.input_with_cache : 0
    const inputWithoutCache = (newCalc.input_without_cache != null) ? newCalc.input_without_cache : 0
    const cacheRead = (newCalc.cache_read != null) ? newCalc.cache_read : 0
    const outputTokens = (newCalc.output_tokens != null) ? newCalc.output_tokens : 0
    
    formData.value = {
      token_count: newCalc.token_count,
      model: newCalc.model,
      context_window: newCalc.context_window ?? null,
      hardware: newCalc.hardware || '',
      data_center_provider: newCalc.data_center_provider || '',
      data_center_region: newCalc.data_center_region || '',
      // Load detailed token fields from database
      input_with_cache: inputWithCache,
      input_without_cache: inputWithoutCache,
      cache_read: cacheRead,
      output_tokens: outputTokens,
    }
    
    console.log('EditCalculationModal - Form data set to:', formData.value)
    
    // Keep detailed mode enabled (already defaults to true)
    // This ensures users can always see and edit the detailed breakdown
    
    // Set preset based on calculation or project default
    if (project.value?.calculation_preset_id || props.projectPresetId) {
      selectedPresetId.value = findPresetForCalculation(newCalc)
    } else {
      // Wait for project to load
      setTimeout(() => {
        selectedPresetId.value = findPresetForCalculation(newCalc)
      }, 100)
    }
  }
}, { immediate: true })

watch(() => project.value, (newProject) => {
  if (newProject && props.calculation) {
    // Always recalculate preset when project loads, in case it wasn't set correctly before
    selectedPresetId.value = findPresetForCalculation(props.calculation)
  }
})

const handlePresetChange = () => {
  if (selectedPresetId.value === 'project-default') {
    // Reset to project preset values (but don't set them - leave null to indicate no override)
    const preset = projectPreset.value
    if (preset) {
      formData.value.model = preset.configuration.model
      formData.value.hardware = preset.configuration.hardware || ''
      formData.value.data_center_provider = preset.configuration.dataCenterProvider || ''
      formData.value.data_center_region = preset.configuration.dataCenterRegion || ''
      // Set context_window to null to indicate using preset defaults
      formData.value.context_window = null
    }
  } else {
    const preset = selectedPreset.value
    if (preset) {
      formData.value.model = preset.configuration.model
      formData.value.context_window = preset.configuration.contextWindow
      formData.value.hardware = preset.configuration.hardware || ''
      formData.value.data_center_provider = preset.configuration.dataCenterProvider || ''
      formData.value.data_center_region = preset.configuration.dataCenterRegion || ''
    }
  }
}

const saveCalculation = async () => {
  if (!props.calculation) return

  saving.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    
    // Determine if we're using project default or a specific preset
    const isProjectDefault = selectedPresetId.value === 'project-default'
    
    // If project default, set context values to null (or undefined) to indicate no override
    // If a preset is selected, use those values
    // If values are manually entered, use those (they're already in formData)
    
    // Calculate token_count based on mode
    // token_count should always be the sum of the four fields, not weighted tokens
    let finalTokenCount = formData.value.token_count
    if (useDetailedTokens.value) {
      // Use sum of four fields for token_count
      finalTokenCount = totalTokenCount.value
    }
    
    // Prepare update payload
    const updatePayload: any = {
      token_count: finalTokenCount,
      model: formData.value.model,
      hardware: formData.value.hardware,
      data_center_provider: formData.value.data_center_provider,
      data_center_region: formData.value.data_center_region,
      user_id: 'default-user',
    }
    
    // Include detailed token fields if using detailed mode
    if (useDetailedTokens.value) {
      updatePayload.cache_read = formData.value.cache_read ?? null
      updatePayload.output_tokens = formData.value.output_tokens ?? null
      updatePayload.input_with_cache = formData.value.input_with_cache ?? null
      updatePayload.input_without_cache = formData.value.input_without_cache ?? null
    } else {
      // Clear detailed fields when switching to simple mode
      updatePayload.cache_read = null
      updatePayload.output_tokens = null
      updatePayload.input_with_cache = null
      updatePayload.input_without_cache = null
    }
    
    // Only include context_window if it's explicitly set (not null)
    // If null, the API will use preset values
    if (isProjectDefault) {
      // For project default, explicitly set to null to clear any overrides
      updatePayload.context_window = null
    } else if (formData.value.context_window !== null && formData.value.context_window !== undefined) {
      // Only include if explicitly set
      updatePayload.context_window = formData.value.context_window
    } else {
      // If preset selected but value not set, use preset value
      const preset = selectedPreset.value
      if (preset) {
        updatePayload.context_window = preset.configuration.contextWindow
      }
    }
    
    // Update the calculation fields
    const updateResponse = await fetch(`${apiBaseUrl}/api/calculations/${props.calculation.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
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

