<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          Assign Tags to {{ calculationIds.length }} Calculation(s)
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <!-- Create New Tag -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Create New Tag</h4>
        <div class="flex gap-2">
          <input
            v-model="newTagName"
            type="text"
            placeholder="Tag name"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            @keyup.enter="createTag"
          />
          <input
            v-model="newTagColor"
            type="color"
            class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
          />
          <button
            @click="createTag"
            :disabled="!newTagName.trim() || creatingTag"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Loader2 v-if="creatingTag" class="w-4 h-4 animate-spin" />
            <span v-else>Create</span>
          </button>
        </div>
      </div>

      <!-- Existing Tags -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Select Tags</h4>
        <div v-if="loading" class="text-center py-4">
          <Loader2 class="w-6 h-6 animate-spin mx-auto text-gray-400" />
        </div>
        <div v-else-if="tags.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
          No tags yet. Create one above.
        </div>
        <div v-else class="space-y-2">
          <label
            v-for="tag in tags"
            :key="tag.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="tag.id"
              v-model="selectedTagIds"
              class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span
              class="inline-flex items-center px-3 py-1 rounded text-sm font-medium"
              :style="{ backgroundColor: tag.color + '20', color: tag.color }"
            >
              {{ tag.name }}
            </span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-2">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          @click="assignTags"
          :disabled="selectedTagIds.length === 0 || assigning"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Loader2 v-if="assigning" class="w-4 h-4 animate-spin" />
          <span v-else>Assign Tags</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import type { Tag } from '~/types/watttime'

interface Props {
  projectId: string
  calculationIds: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'assigned'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tags = ref<Tag[]>([])
const selectedTagIds = ref<number[]>([])
const newTagName = ref('')
const newTagColor = ref('#3b82f6')
const loading = ref(false)
const creatingTag = ref(false)
const assigning = ref(false)

const fetchTags = async () => {
  loading.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/tags/project/${props.projectId}?user_id=default-user`)
    const data = await response.json()
    if (data.success) {
      tags.value = data.data || []
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
  } finally {
    loading.value = false
  }
}

const createTag = async () => {
  if (!newTagName.value.trim()) return

  creatingTag.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_id: props.projectId,
        name: newTagName.value.trim(),
        color: newTagColor.value,
        user_id: 'default-user',
      }),
    })

    const data = await response.json()
    if (data.success) {
      newTagName.value = ''
      await fetchTags()
      selectedTagIds.value.push(data.data.id)
    }
  } catch (error) {
    console.error('Error creating tag:', error)
  } finally {
    creatingTag.value = false
  }
}

const assignTags = async () => {
  if (selectedTagIds.value.length === 0) return

  assigning.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/tags/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        calculation_ids: props.calculationIds.map(id => parseInt(id)),
        tag_ids: selectedTagIds.value,
        user_id: 'default-user',
      }),
    })

    const data = await response.json()
    if (data.success) {
      emit('assigned')
    }
  } catch (error) {
    console.error('Error assigning tags:', error)
  } finally {
    assigning.value = false
  }
}

onMounted(() => {
  fetchTags()
})
</script>

