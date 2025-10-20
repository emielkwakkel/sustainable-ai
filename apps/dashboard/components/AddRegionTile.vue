<template>
  <div class="relative">
    <div 
      class="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer"
      @click="toggleDropdown"
    >
      <div class="flex flex-col items-center justify-center space-y-3 text-center">
        <Plus class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Add Region</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Click to select a region to monitor</p>
        </div>
      </div>
    </div>

    <!-- Dropdown -->
    <div 
      v-if="showDropdown"
      class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[100] max-h-60 overflow-y-auto"
    >
      <div class="p-2">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search regions..."
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @click.stop
          />
        </div>
        
        <div class="mt-2 space-y-1">
          <button
            v-for="region in filteredRegions"
            :key="region.code"
            @click="selectRegion(region)"
            class="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            :disabled="isRegionSelected(region.code)"
          >
            <div class="font-medium">{{ region.name }}</div>
            <div v-if="region.description" class="text-xs text-gray-600 dark:text-gray-400">
              {{ region.description }}
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import type { AvailableRegion } from '~/types/watttime'

interface Props {
  availableRegions: AvailableRegion[]
  selectedRegions: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addRegion: [region: AvailableRegion]
}>()

const showDropdown = ref(false)
const searchQuery = ref('')

const filteredRegions = computed(() => {
  if (!searchQuery.value) return props.availableRegions
  
  const query = searchQuery.value.toLowerCase()
  return props.availableRegions.filter(region => 
    region.name.toLowerCase().includes(query) ||
    region.description?.toLowerCase().includes(query) ||
    region.code.toLowerCase().includes(query)
  )
})

const toggleDropdown = () => {
  console.log('Toggle dropdown clicked, current state:', showDropdown.value)
  showDropdown.value = !showDropdown.value
  console.log('New state:', showDropdown.value)
}

const selectRegion = (region: AvailableRegion) => {
  emit('addRegion', region)
  showDropdown.value = false
  searchQuery.value = ''
}

const isRegionSelected = (code: string) => {
  return props.selectedRegions.includes(code)
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const container = target.closest('.relative')
    if (!container) {
      showDropdown.value = false
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>
