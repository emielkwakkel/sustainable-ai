<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Carbon Aware Dashboard</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Monitor real-time carbon intensity across multiple regions
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <button
          @click="refreshAllRegions"
          :disabled="isRefreshing"
          class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw :class="cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')" />
          Refresh
        </button>
      </div>
    </div>

    <!-- Connection Status Banner -->
    <ConnectionBanner />

    <!-- Dashboard Content -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Region Tiles -->
      <RegionTile
        v-for="region in regions"
        :key="region.id"
        :region="region"
        @remove="removeRegion(region.id)"
        @retry="retryRegion(region.id)"
      />

      <!-- Add Region Tile -->
      <AddRegionTile
        :available-regions="availableRegions"
        :selected-regions="selectedRegionCodes"
        @add-region="addRegion"
      />
    </div>

    <!-- Empty State -->
    <div v-if="regions.length === 0" class="text-center py-12">
      <div class="max-w-md mx-auto">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No regions selected
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Add regions to start monitoring carbon intensity data
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Click the "Add Region" tile below to get started
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Globe, Plus } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import type { DashboardRegion, AvailableRegion } from '~/types/watttime'

// Set page title
useHead({
  title: 'Dashboard - Sustainable AI Dashboard'
})

// Composables
import { useCarbonIntensity } from '~/composables/useCarbonIntensity'
import { useTokenManager } from '~/composables/useTokenManager'

const { availableRegions, getCurrentIntensity } = useCarbonIntensity()
const { connectionStatus } = useTokenManager()

// State
const regions = ref<DashboardRegion[]>([])
const isRefreshing = ref(false)

// Computed
const selectedRegionCodes = computed(() => regions.value.map(r => r.region))

// Methods
const addRegion = async (region: AvailableRegion) => {
  const newRegion: DashboardRegion = {
    id: `region-${Date.now()}`,
    region: region.code,
    name: region.name,
    isLoading: true
  }
  
  regions.value.push(newRegion)
  console.log('New region added:', newRegion)
  
  // Fetch data for the new region
  await fetchRegionData(newRegion.id)
}

const removeRegion = (id: string) => {
  const index = regions.value.findIndex(r => r.id === id)
  if (index > -1) {
    regions.value.splice(index, 1)
  }
}

const retryRegion = async (id: string) => {
  const region = regions.value.find(r => r.id === id)
  if (region) {
    region.isLoading = true
    region.error = undefined
    await fetchRegionData(id)
  }
}

const fetchRegionData = async (id: string) => {
  const region = regions.value.find(r => r.id === id)
  if (!region) return

  try {
    const response = await getCurrentIntensity(region.region)
    
    if (response.success && response.data) {
      region.moer = response.data.value // This is a percentile (0-100)
      region.lastUpdated = response.data.point_time
      region.error = undefined
    } else {
      region.error = response.error || 'Failed to fetch data'
    }
  } catch (error: any) {
    region.error = error.message || 'Failed to fetch data'
  } finally {
    region.isLoading = false
  }
}

const refreshAllRegions = async () => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  try {
    await Promise.all(
      regions.value.map(region => fetchRegionData(region.id))
    )
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh every 5 minutes
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // Check connection status
  if (connectionStatus.value.connected) {
    refreshInterval = setInterval(refreshAllRegions, 5 * 60 * 1000) // 5 minutes
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Watch connection status
watch(connectionStatus, (newStatus) => {
  if (newStatus.connected && !refreshInterval) {
    refreshInterval = setInterval(refreshAllRegions, 5 * 60 * 1000)
  } else if (!newStatus.connected && refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>
