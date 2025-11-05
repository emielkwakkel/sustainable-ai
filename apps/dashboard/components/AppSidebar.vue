<template>
  <aside
    :class="cn(
      'fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-16' : 'w-64',
      'dark:bg-gray-900 dark:border-gray-700'
    )"
  >
    <!-- Header with toggle button -->
    <div class="flex items-center justify-between px-4 pt-4 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div v-if="!isCollapsed" class="flex items-center space-x-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">SA</span>
        </div>
        <span class="font-semibold text-gray-900 dark:text-white">Sustainable AI</span>
      </div>
      <button
        @click="toggleCollapse"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        :aria-label="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft v-if="!isCollapsed" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <ChevronRight v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4" role="navigation" aria-label="Main navigation">
      <ul class="space-y-2">
        <li v-for="item in menuItems" :key="item.name">
          <NuxtLink
            :to="item.href"
            :class="cn(
              'flex items-center rounded-lg transition-colors',
              isCollapsed ? 'justify-center px-3 py-2' : 'space-x-3 px-3 py-2',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'dark:focus:ring-offset-gray-900',
              isActive(item.href) 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300'
            )"
            :aria-current="isActive(item.href) ? 'page' : undefined"
          >
            <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span v-if="!isCollapsed" class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Footer -->
    <div v-if="!isCollapsed" class="p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Sustainable AI Dashboard v1.0
      </div>
    </div>
  </aside>

  <!-- Mobile overlay -->
  <div
    v-if="isMobile && !isCollapsed"
    class="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
    @click="toggleCollapse"
  ></div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, BarChart3, Calculator, Settings, FolderOpen, MessageSquare } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import { useAppPreferences } from '~/composables/useAppPreferences'

// Initialize app preferences to ensure theme is applied
const { preferences } = useAppPreferences()

interface MenuItem {
  name: string
  label: string
  href: string
  icon: any
}

const route = useRoute()
const isCollapsed = useState('sidebar-collapsed', () => false)
const isMobile = useState('is-mobile', () => false)

const menuItems: MenuItem[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: BarChart3
  },
  {
    name: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: FolderOpen
  },
  {
    name: 'calculator',
    label: 'Token Calculator',
    href: '/calculator',
    icon: Calculator
  },
  {
    name: 'token-simulator',
    label: 'Token Simulator',
    href: '/token-simulator',
    icon: MessageSquare
  },
  {
    name: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

const isActive = (href: string) => {
  if (href === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(href)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // Persist state to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('sidebar-collapsed', isCollapsed.value.toString())
  }
}

// Check for mobile screen size
const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 1024
    if (isMobile.value) {
      isCollapsed.value = true
    }
  }
}

// Initialize sidebar state from localStorage
onMounted(() => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      isCollapsed.value = saved === 'true'
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile)
  }
})
</script>
