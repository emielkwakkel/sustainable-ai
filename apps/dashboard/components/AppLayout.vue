<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <AppSidebar />
    
    <!-- Main content area -->
    <main 
      :class="cn(
        'transition-all duration-300 ease-in-out',
        'lg:ml-64',
        isCollapsed && 'lg:ml-16'
      )"
      class="min-h-screen"
    >
      <!-- Mobile header -->
      <header class="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <button
            @click="toggleSidebar"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu class="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
            Sustainable AI Dashboard
          </h1>
        </div>
      </header>

      <!-- Page content -->
      <div class="p-6">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { Menu } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import { useAppPreferences } from '~/composables/useAppPreferences'

// Initialize app preferences to ensure theme is applied
const { preferences } = useAppPreferences()

// Ensure dark mode is applied on mount
onMounted(() => {
  console.log('AppLayout mounted, dark mode:', preferences.value.darkMode)
  const html = document.documentElement
  if (preferences.value.darkMode) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
})

const isCollapsed = useState('sidebar-collapsed', () => false)
const isMobile = useState('is-mobile', () => false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>
