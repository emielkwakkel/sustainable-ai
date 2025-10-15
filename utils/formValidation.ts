import type { FormFieldError, FormValidationResult } from '~/types/watttime'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Password validation rules
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

export const validateEmail = (email: string): FormFieldError | null => {
  if (!email.trim()) {
    return { field: 'email', message: 'Email is required' }
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' }
  }
  
  return null
}

export const validatePassword = (password: string): FormFieldError | null => {
  if (!password) {
    return { field: 'password', message: 'Password is required' }
  }
  
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { field: 'password', message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` }
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      field: 'password', 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
    }
  }
  
  return null
}

export const validateUsername = (username: string): FormFieldError | null => {
  if (!username.trim()) {
    return { field: 'username', message: 'Username is required' }
  }
  
  if (username.length < 3) {
    return { field: 'username', message: 'Username must be at least 3 characters long' }
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { field: 'username', message: 'Username can only contain letters, numbers, underscores, and hyphens' }
  }
  
  return null
}

export const validateRegistrationForm = (username: string, email: string, password: string, org?: string): FormValidationResult => {
  const errors: FormFieldError[] = []
  
  const usernameError = validateUsername(username)
  if (usernameError) errors.push(usernameError)
  
  const emailError = validateEmail(email)
  if (emailError) errors.push(emailError)
  
  const passwordError = validatePassword(password)
  if (passwordError) errors.push(passwordError)
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateLoginForm = (username: string, password: string): FormValidationResult => {
  const errors: FormFieldError[] = []
  
  if (!username.trim()) {
    errors.push({ field: 'username', message: 'Username is required' })
  }
  
  if (!password) {
    errors.push({ field: 'password', message: 'Password is required' })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Real-time validation helpers
export const getFieldError = (errors: FormFieldError[], field: string): string | null => {
  const error = errors.find(e => e.field === field)
  return error ? error.message : null
}

// Debounced validation for real-time feedback
export const useDebouncedValidation = (value: Ref<string>, validator: (val: string) => FormFieldError | null, delay = 300) => {
  const error = ref<FormFieldError | null>(null)
  const isValidating = ref(false)
  
  let timeoutId: NodeJS.Timeout | null = null
  
  watch(value, (newValue) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    isValidating.value = true
    
    timeoutId = setTimeout(() => {
      error.value = validator(newValue)
      isValidating.value = false
    }, delay)
  }, { immediate: true })
  
  return {
    error: readonly(error),
    isValidating: readonly(isValidating)
  }
}
