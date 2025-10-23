<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Configure API connections and application preferences
        </p>
      </div>
    </div>


    <!-- Connection Status -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Connection Status</h3>
        <button 
          @click="checkConnection"
          :disabled="isCheckingConnection"
          class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          <span v-if="isCheckingConnection" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Checking...
          </span>
          <span v-else>Refresh</span>
        </button>
      </div>
      
      <!-- Overall Status -->
      <div class="mb-6">
        <div class="flex items-center space-x-3 mb-2">
          <div :class="[
            'w-4 h-4 rounded-full',
            connectionStatus.overall ? 'bg-green-500' : 'bg-red-500'
          ]"></div>
          <span class="text-lg font-medium text-gray-900 dark:text-white">
            {{ connectionStatus.overall ? 'All Systems Connected' : 'Connection Issues Detected' }}
          </span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ connectionStatus.overall 
            ? 'Both WattTime and API services are operational.' 
            : 'One or more services are not available. Check individual statuses below.' 
          }}
        </p>
      </div>

      <!-- WattTime Status -->
      <div class="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-gray-900 dark:text-white">WattTime API</h4>
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.watttime.connected ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ connectionStatus.watttime.connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {{ connectionStatus.watttime.connected 
            ? 'Access to real-time carbon intensity data is available.' 
            : 'Connect to WattTime to access real-time carbon intensity data.' 
          }}
        </p>
        
        <div v-if="connectionStatus.watttime.connected && connectionStatus.watttime.expires" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Token expires: {{ formatDate(connectionStatus.watttime.expires) }}
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            @click="openWattTimeLoginPopup"
            :disabled="connectionStatus.watttime.connected"
            :class="[
              'px-3 py-1 text-sm rounded transition-colors',
              connectionStatus.watttime.connected
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
            ]"
          >
            {{ connectionStatus.watttime.connected ? 'Logged in' : 'Login' }}
          </button>
          
          <button 
            @click="openWattTimeRegisterPopup"
            class="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            Register new Account
          </button>
          
          <button 
            v-if="connectionStatus.watttime.connected"
            @click="handleLogout"
            class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      <!-- API Health Status -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-gray-900 dark:text-white">Middleware API</h4>
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.api.healthy ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ connectionStatus.api.healthy ? 'Healthy' : 'Unhealthy' }}
            </span>
          </div>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ connectionStatus.api.healthy 
            ? 'API server is running and responding to requests.' 
            : 'API server is not available. Check if the server is running on port 3001.' 
          }}
        </p>
        
        <div v-if="connectionStatus.api.healthy && connectionStatus.api.version" class="text-xs text-gray-500 dark:text-gray-400">
          Version: {{ connectionStatus.api.version }} | 
          Uptime: {{ formatUptime(connectionStatus.api.uptime) }} | 
          Environment: {{ connectionStatus.api.environment }}
        </div>
        
        <div v-if="!connectionStatus.api.healthy && connectionStatus.api.error" class="text-xs text-red-500 dark:text-red-400 mt-1">
          Error: {{ connectionStatus.api.error }}
        </div>
      </div>

      <!-- Cursor API Status -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-medium text-gray-900 dark:text-white">Cursor API</h4>
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-2 h-2 rounded-full',
              connectionStatus.cursor.connected ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ connectionStatus.cursor.connected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {{ connectionStatus.cursor.connected 
            ? 'Access to Cursor usage data is available for import.' 
            : 'Connect to Cursor API to import usage data into your projects.' 
          }}
        </p>
        
        <div v-if="connectionStatus.cursor.connected && connectionStatus.cursor.lastTest" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Last tested: {{ formatDate(connectionStatus.cursor.lastTest) }}
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            @click="openCursorTokenModal"
            :disabled="connectionStatus.cursor.connected"
            :class="[
              'px-3 py-1 text-sm rounded transition-colors',
              connectionStatus.cursor.connected
                ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
            ]"
          >
            {{ connectionStatus.cursor.connected ? 'Token Set' : 'Set Token' }}
          </button>
          
          <button 
            @click="testCursorConnection"
            :disabled="!connectionStatus.cursor.connected || isTestingCursor"
            :class="[
              'px-3 py-1 text-sm rounded transition-colors',
              connectionStatus.cursor.connected && !isTestingCursor
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            ]"
          >
            <span v-if="isTestingCursor" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Testing...
            </span>
            <span v-else>Test Connection</span>
          </button>
          
          <button 
            v-if="connectionStatus.cursor.connected"
            @click="clearCursorToken"
            class="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            Clear Token
          </button>
        </div>
        
        <div v-if="cursorTestResult" class="mt-3 p-3 rounded-lg" :class="[
          cursorTestResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        ]">
          <div class="flex items-center space-x-2">
            <div :class="[
              'w-2 h-2 rounded-full',
              cursorTestResult.success ? 'bg-green-500' : 'bg-red-500'
            ]"></div>
            <span class="text-sm font-medium" :class="[
              cursorTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            ]">
              {{ cursorTestResult.success ? 'Connection Successful' : 'Connection Failed' }}
            </span>
          </div>
          <p class="text-xs mt-1" :class="[
            cursorTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          ]">
            {{ cursorTestResult.message }}
          </p>
        </div>
      </div>
    </div>

    <!-- Application Preferences -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Preferences</h3>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">Enable dark mode for better viewing in low light</p>
          </div>
          <button 
            @click="toggleDarkMode"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preferences.darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            ]"
          >
            <span :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
            ]"></span>
          </button>
        </div>
        
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-refresh</label>
            <p class="text-sm text-gray-600 dark:text-gray-400">Automatically refresh data every {{ preferences.refreshInterval }} minutes</p>
          </div>
          <button 
            @click="toggleAutoRefresh"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preferences.autoRefresh ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            ]"
          >
            <span :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              preferences.autoRefresh ? 'translate-x-6' : 'translate-x-1'
            ]"></span>
          </button>
        </div>
      </div>
    </div>

    <!-- WattTime Login Popup -->
    <WattTimeLoginPopup
      :is-open="isWattTimeLoginPopupOpen"
      @close="closeWattTimeLoginPopup"
      @login-success="handleLoginSuccess"
    />

    <!-- WattTime Register Popup -->
    <WattTimeRegisterPopup
      :is-open="isWattTimeRegisterPopupOpen"
      @close="closeWattTimeRegisterPopup"
      @registration-success="handleRegistrationSuccess"
    />

    <!-- Cursor Token Modal -->
    <CursorTokenModal
      :is-open="isCursorTokenModalOpen"
      @close="closeCursorTokenModal"
      @token-set="handleCursorTokenSet"
    />
  </div>
</template>

<script setup lang="ts">
// Set page title
useHead({
  title: 'Settings - Sustainable AI Dashboard'
})

// Composables
import { useTokenManager } from '~/composables/useTokenManager'
import { useAppPreferences } from '~/composables/useAppPreferences'

const { connectionStatus, checkConnectionStatus, removeToken } = useTokenManager()
const { preferences, updatePreference } = useAppPreferences()

// Popup state
const isWattTimeLoginPopupOpen = ref(false)
const isWattTimeRegisterPopupOpen = ref(false)
const isCursorTokenModalOpen = ref(false)
const isCheckingConnection = ref(false)
const isTestingCursor = ref(false)
const cursorTestResult = ref<{ success: boolean; message: string } | null>(null)

// Popup handlers
const openWattTimeLoginPopup = () => {
  isWattTimeLoginPopupOpen.value = true
}

const closeWattTimeLoginPopup = () => {
  isWattTimeLoginPopupOpen.value = false
}

const openWattTimeRegisterPopup = () => {
  isWattTimeRegisterPopupOpen.value = true
}

const closeWattTimeRegisterPopup = () => {
  isWattTimeRegisterPopupOpen.value = false
}

const openCursorTokenModal = () => {
  isCursorTokenModalOpen.value = true
}

const closeCursorTokenModal = () => {
  isCursorTokenModalOpen.value = false
}

const handleLoginSuccess = async () => {
  await checkConnectionStatus()
  closeWattTimeLoginPopup()
}

const handleRegistrationSuccess = () => {
  // Registration success - popup will show success message
  // User can then use the login popup
  closeWattTimeRegisterPopup()
}

const handleCursorTokenSet = async () => {
  await checkConnectionStatus()
  closeCursorTokenModal()
}

// Connection check
const checkConnection = async () => {
  isCheckingConnection.value = true
  try {
    await checkConnectionStatus()
  } finally {
    isCheckingConnection.value = false
  }
}

// Logout handler
const handleLogout = () => {
  removeToken()
}

// Cursor API handlers
const testCursorConnection = async () => {
  isTestingCursor.value = true
  cursorTestResult.value = null
  
  try {
    const token = localStorage.getItem('cursor_api_token')
    if (!token) {
      cursorTestResult.value = {
        success: false,
        message: 'No Cursor API token found. Please set a token first.'
      }
      return
    }

    const apiBaseUrl = process.env.NODE_ENV === 'development' ? 'https://localhost:3001' : window.location.origin
    const response = await fetch(`${apiBaseUrl}/api/cursor-import/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    })

    const data = await response.json()
    cursorTestResult.value = {
      success: data.success,
      message: data.message || (data.success ? 'Connection successful' : 'Connection failed')
    }
  } catch (error) {
    cursorTestResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  } finally {
    isTestingCursor.value = false
  }
}

const clearCursorToken = () => {
  localStorage.removeItem('cursor_api_token')
  cursorTestResult.value = null
  checkConnectionStatus()
}

// Preference handlers
const toggleDarkMode = () => {
  console.log('Current dark mode:', preferences.value.darkMode)
  updatePreference('darkMode', !preferences.value.darkMode)
  console.log('New dark mode:', preferences.value.darkMode)
  console.log('HTML classes:', document.documentElement.classList.toString())
}

const toggleAutoRefresh = () => {
  updatePreference('autoRefresh', !preferences.value.autoRefresh)
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

const formatUptime = (uptimeSeconds?: number) => {
  if (!uptimeSeconds) return 'Unknown'
  
  const hours = Math.floor(uptimeSeconds / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = Math.floor(uptimeSeconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Check connection status on page load
onMounted(async () => {
  await checkConnectionStatus()
})
</script>
