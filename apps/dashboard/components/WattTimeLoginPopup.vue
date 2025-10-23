<template>
  <!-- Popup Overlay -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleOverlayClick"
  >
    <!-- Popup Content -->
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Connect to WattTime
        </h2>
        <button 
          @click="closePopup"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="mb-4">
          <p class="text-gray-600 dark:text-gray-400">
            Connect your existing WattTime account to access real-time data.
          </p>
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { validateLoginForm } from '~/utils/formValidation'
import type { WattTimeLoginRequest } from '~/types/watttime'

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  loginSuccess: []
}>()

// Composables
import { useWattTimeApi } from '~/composables/useWattTimeApi'
import { useTokenManager } from '~/composables/useTokenManager'

const { login } = useWattTimeApi()
const { checkConnectionStatus } = useTokenManager()

// Form state
const loginForm = ref<WattTimeLoginRequest>({
  username: '',
  password: ''
})

// Loading states
const isLoggingIn = ref(false)

// Messages
const loginMessage = ref('')
const loginSuccess = ref(false)

// Form errors
const loginErrors = ref<Record<string, string>>({})

// Methods
const closePopup = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  loginForm.value = { username: '', password: '' }
  loginMessage.value = ''
  loginSuccess.value = false
  loginErrors.value = {}
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closePopup()
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
      emit('loginSuccess')
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

// Reset form when popup opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>
