<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <div 
      class="p-6 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      @click="collapsed = !collapsed"
    >
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Filters</h2>
        <div class="flex items-center gap-2">
          <button
            v-if="hasActiveFilters"
            @click.stop="clearFilters"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Clear All Filters
          </button>
          <ChevronDown 
            :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform', collapsed && 'rotate-180']"
          />
        </div>
      </div>
    </div>

    <div v-show="!collapsed" class="p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Date Range -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Date Range
        </label>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              v-model="localStartDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              v-model="localEndDate"
              type="date"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Tags Filter -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div v-if="loadingTags" class="text-sm text-gray-500 dark:text-gray-400">
          Loading tags...
        </div>
        <div v-else-if="availableTags.length === 0" class="text-sm text-gray-500 dark:text-gray-400">
          No tags available
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="tag in availableTags"
            :key="tag.id"
            @click="toggleTag(tag.id)"
            :class="[
              'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              selectedTagIds.includes(tag.id)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
          >
            <span
              class="w-2 h-2 rounded-full mr-2"
              :style="{ backgroundColor: tag.color }"
            ></span>
            {{ tag.name }}
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import type { Tag } from '~/types/watttime'

interface Props {
  projectId: string
  startDate?: string
  endDate?: string
  selectedTagIds: number[]
}

interface Emits {
  (e: 'update:startDate', value: string | undefined): void
  (e: 'update:endDate', value: string | undefined): void
  (e: 'update:selectedTagIds', value: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const collapsed = ref(false)
const availableTags = ref<Tag[]>([])
const loadingTags = ref(false)
const localStartDate = ref(props.startDate || '')
const localEndDate = ref(props.endDate || '')
const selectedTagIds = ref<number[]>([...props.selectedTagIds])

const hasActiveFilters = computed(() => {
  return localStartDate.value !== '' || localEndDate.value !== '' || selectedTagIds.value.length > 0
})

const fetchTags = async () => {
  loadingTags.value = true
  try {
    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/tags/project/${props.projectId}?user_id=default-user`)
    const data = await response.json()
    if (data.success) {
      availableTags.value = data.data || []
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
  } finally {
    loadingTags.value = false
  }
}

const toggleTag = (tagId: number) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
  emit('update:selectedTagIds', [...selectedTagIds.value])
}

const clearFilters = () => {
  localStartDate.value = ''
  localEndDate.value = ''
  selectedTagIds.value = []
  emit('update:startDate', undefined)
  emit('update:endDate', undefined)
  emit('update:selectedTagIds', [])
}

watch(localStartDate, (value) => {
  emit('update:startDate', value || undefined)
})

watch(localEndDate, (value) => {
  emit('update:endDate', value || undefined)
})

watch(() => props.selectedTagIds, (value) => {
  selectedTagIds.value = [...value]
})

onMounted(() => {
  fetchTags()
})
</script>

