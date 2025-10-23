<template>
  <!-- Popup Overlay -->
  <div 
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleOverlayClick"
  >
    <!-- Popup Content -->
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Register to WattTime
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
            Create a new WattTime account to access real-time carbon intensity data.
          </p>
        </div>
        
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { validateRegistrationForm } from '~/utils/formValidation'
import type { WattTimeRegistrationRequest } from '~/types/watttime'

// Props
interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  registrationSuccess: []
}>()

// Composables
import { useWattTimeApi } from '~/composables/useWattTimeApi'

const { register } = useWattTimeApi()

// Form state
const registrationForm = ref<WattTimeRegistrationRequest>({
  username: '',
  email: '',
  password: '',
  org: ''
})

// Loading states
const isRegistering = ref(false)

// Messages
const registrationMessage = ref('')
const registrationSuccess = ref(false)

// Form errors
const registrationErrors = ref<Record<string, string>>({})

// Methods
const closePopup = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  registrationForm.value = { username: '', email: '', password: '', org: '' }
  registrationMessage.value = ''
  registrationSuccess.value = false
  registrationErrors.value = {}
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    closePopup()
  }
}

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
      emit('registrationSuccess')
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

// Reset form when popup opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>
