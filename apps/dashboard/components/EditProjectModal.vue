<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Project
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Project Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name *
            </label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project name"
            />
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter project description (optional)"
            />
          </div>

          <!-- Calculation Preset -->
          <div>
            <label for="preset" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Calculation Preset *
            </label>
            <select
              id="preset"
              v-model="formData.calculation_preset_id"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4-token-research">GPT-4 Token Research</option>
              <option value="cursor-ai">Cursor.ai</option>
              <option value="claude-research">Claude Research</option>
              <option value="llama-experiments">Llama Experiments</option>
              <option value="general-ai-usage">General AI Usage</option>
              <option value="custom">Custom Configuration</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This preset will be used for all calculations in this project
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="loading">Updating...</span>
              <span v-else>Update Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { Project } from '~/types/watttime'
import { useProjects } from '~/composables/useProjects'

// Props
interface Props {
  project: Project | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  updated: []
}>()

// Composables
const { updateProject } = useProjects()

// State
const formData = ref({
  name: '',
  description: '',
  calculation_preset_id: 'gpt-4'
})

const loading = ref(false)
const error = ref<string | null>(null)

// Watch for project changes
watch(() => props.project, (newProject) => {
  if (newProject) {
    formData.value = {
      name: newProject.name,
      description: newProject.description || '',
      calculation_preset_id: newProject.calculation_preset_id
    }
  }
}, { immediate: true })

// Methods
const handleSubmit = async () => {
  if (!props.project) return

  if (!formData.value.name.trim()) {
    error.value = 'Project name is required'
    return
  }

  if (!formData.value.calculation_preset_id) {
    error.value = 'Calculation preset is required'
    return
  }

  loading.value = true
  error.value = null

  try {
    await updateProject(props.project.id, {
      name: formData.value.name.trim(),
      description: formData.value.description.trim() || undefined,
      calculation_preset_id: formData.value.calculation_preset_id
    })

    // Emit success
    emit('updated')
  } catch (err) {
    console.error('Error updating project:', err)
    error.value = err instanceof Error ? err.message : 'Failed to update project'
  } finally {
    loading.value = false
  }
}
</script>
