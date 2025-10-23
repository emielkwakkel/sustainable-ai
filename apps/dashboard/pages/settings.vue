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

    <!-- WattTime Registration Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Register to WattTime</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Create a new WattTime account to access real-time carbon intensity data.
      </p>
      
      <form @submit.prevent="handleRegistration" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input 
              v-model="registrationForm.username"
              type="text" 
              placeholder="Enter your username"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                registrationErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <p v-if="registrationErrors.username" class="text-red-500 text-sm mt-1">
              {{ registrationErrors.username }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input 
              v-model="registrationForm.email"
              type="email" 
              placeholder="Enter your email"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                registrationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <p v-if="registrationErrors.email" class="text-red-500 text-sm mt-1">
              {{ registrationErrors.email }}
            </p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input 
              v-model="registrationForm.password"
              type="password" 
              placeholder="Enter your password"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                registrationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <p v-if="registrationErrors.password" class="text-red-500 text-sm mt-1">
              {{ registrationErrors.password }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organization (Optional)
            </label>
            <input 
              v-model="registrationForm.org"
              type="text" 
              placeholder="Enter your organization"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <button 
            type="submit"
            :disabled="isRegistering"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isRegistering" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
            <span v-else>Register Account</span>
          </button>
          
          <p v-if="registrationMessage" :class="[
            'text-sm',
            registrationSuccess ? 'text-green-600' : 'text-red-500'
          ]">
            {{ registrationMessage }}
          </p>
        </div>
      </form>
    </div>

    <!-- WattTime Connection Section -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connect to WattTime</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Connect your existing WattTime account to access real-time data.
      </p>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input 
              v-model="loginForm.username"
              type="text" 
              placeholder="Enter your username"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                loginErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <p v-if="loginErrors.username" class="text-red-500 text-sm mt-1">
              {{ loginErrors.username }}
            </p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input 
              v-model="loginForm.password"
              type="password" 
              placeholder="Enter your password"
              :class="[
                'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                loginErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              ]"
            />
            <p v-if="loginErrors.password" class="text-red-500 text-sm mt-1">
              {{ loginErrors.password }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <button 
            type="submit"
            :disabled="isLoggingIn"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoggingIn" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
            <span v-else>Connect Account</span>
          </button>
          
          <p v-if="loginMessage" :class="[
            'text-sm',
            loginSuccess ? 'text-green-600' : 'text-red-500'
          ]">
            {{ loginMessage }}
          </p>
        </div>
      </form>
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
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ connectionStatus.watttime.connected 
            ? 'Access to real-time carbon intensity data is available.' 
            : 'Connect to WattTime to access real-time carbon intensity data.' 
          }}
        </p>
        
        <div v-if="connectionStatus.watttime.connected && connectionStatus.watttime.expires" class="text-xs text-gray-500 dark:text-gray-400">
          Token expires: {{ formatDate(connectionStatus.watttime.expires) }}
        </div>
        
        <div v-if="connectionStatus.watttime.connected" class="mt-2">
          <button 
            @click="handleLogout"
            class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
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
  </div>
</template>

<script setup lang="ts">
import { validateRegistrationForm, validateLoginForm, getFieldError } from '~/utils/formValidation'
import type { WattTimeRegistrationRequest, WattTimeLoginRequest } from '~/types/watttime'

// Set page title
useHead({
  title: 'Settings - Sustainable AI Dashboard'
})

// Composables
import { useWattTimeApi } from '~/composables/useWattTimeApi'
import { useTokenManager } from '~/composables/useTokenManager'
import { useAppPreferences } from '~/composables/useAppPreferences'

const { register, login } = useWattTimeApi()
const { connectionStatus, checkConnectionStatus, removeToken } = useTokenManager()
const { preferences, updatePreference } = useAppPreferences()

// Form state
const registrationForm = ref<WattTimeRegistrationRequest>({
  username: '',
  email: '',
  password: '',
  org: ''
})

const loginForm = ref<WattTimeLoginRequest>({
  username: '',
  password: ''
})

// Loading states
const isRegistering = ref(false)
const isLoggingIn = ref(false)
const isCheckingConnection = ref(false)

// Messages
const registrationMessage = ref('')
const registrationSuccess = ref(false)
const loginMessage = ref('')
const loginSuccess = ref(false)

// Form errors
const registrationErrors = ref<Record<string, string>>({})
const loginErrors = ref<Record<string, string>>({})

// Registration handler
const handleRegistration = async () => {
  // Clear previous messages
  registrationMessage.value = ''
  registrationErrors.value = {}
  
  // Validate form
  const validation = validateRegistrationForm(
    registrationForm.value.username, 
    registrationForm.value.email, 
    registrationForm.value.password, 
    registrationForm.value.org
  )
  if (!validation.isValid) {
    validation.errors.forEach(error => {
      registrationErrors.value[error.field] = error.message
    })
    return
  }
  
  isRegistering.value = true
  
  try {
    const result = await register(registrationForm.value)
    
    if (result.success) {
      registrationSuccess.value = true
      registrationMessage.value = 'Account registered successfully! You can now connect to WattTime.'
      // Clear form
      registrationForm.value = { username: '', email: '', password: '', org: '' }
    } else {
      registrationSuccess.value = false
      registrationMessage.value = result.error || 'Registration failed. Please try again.'
    }
  } catch (error) {
    registrationSuccess.value = false
    registrationMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isRegistering.value = false
  }
}

// Login handler
const handleLogin = async () => {
  // Clear previous messages
  loginMessage.value = ''
  loginErrors.value = {}
  
  // Validate form
  const validation = validateLoginForm(loginForm.value.username, loginForm.value.password)
  if (!validation.isValid) {
    validation.errors.forEach(error => {
      loginErrors.value[error.field] = error.message
    })
    return
  }
  
  isLoggingIn.value = true
  
  try {
    const result = await login(loginForm.value)
    
    if (result.success) {
      loginSuccess.value = true
      loginMessage.value = 'Successfully connected to WattTime!'
      // Clear form
      loginForm.value = { username: '', password: '' }
      // Update connection status
      await checkConnectionStatus()
    } else {
      loginSuccess.value = false
      loginMessage.value = result.error || 'Login failed. Please check your credentials.'
    }
  } catch (error) {
    loginSuccess.value = false
    loginMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoggingIn.value = false
  }
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
  loginMessage.value = ''
  registrationMessage.value = ''
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
