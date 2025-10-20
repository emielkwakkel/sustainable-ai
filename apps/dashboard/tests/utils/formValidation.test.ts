import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validatePassword, 
  validateUsername,
  validateRegistrationForm, 
  validateLoginForm 
} from '~/utils/formValidation'

describe('formValidation', () => {
  describe('validateEmail', () => {
    it('should return error for empty email', () => {
      const result = validateEmail('')
      expect(result).toEqual({
        field: 'email',
        message: 'Email is required'
      })
    })

    it('should return error for invalid email format', () => {
      const result = validateEmail('invalid-email')
      expect(result).toEqual({
        field: 'email',
        message: 'Please enter a valid email address'
      })
    })

    it('should return null for valid email', () => {
      const result = validateEmail('test@example.com')
      expect(result).toBeNull()
    })
  })

  describe('validatePassword', () => {
    it('should return error for empty password', () => {
      const result = validatePassword('')
      expect(result).toEqual({
        field: 'password',
        message: 'Password is required'
      })
    })

    it('should return error for password too short', () => {
      const result = validatePassword('123')
      expect(result).toEqual({
        field: 'password',
        message: 'Password must be at least 8 characters long'
      })
    })

    it('should return error for password without required characters', () => {
      const result = validatePassword('password123')
      expect(result).toEqual({
        field: 'password',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      })
    })

    it('should return null for valid password', () => {
      const result = validatePassword('Password123!')
      expect(result).toBeNull()
    })
  })

  describe('validateUsername', () => {
    it('should return error for empty username', () => {
      const result = validateUsername('')
      expect(result).toEqual({
        field: 'username',
        message: 'Username is required'
      })
    })

    it('should return error for username too short', () => {
      const result = validateUsername('ab')
      expect(result).toEqual({
        field: 'username',
        message: 'Username must be at least 3 characters long'
      })
    })

    it('should return error for username with invalid characters', () => {
      const result = validateUsername('user@name')
      expect(result).toEqual({
        field: 'username',
        message: 'Username can only contain letters, numbers, underscores, and hyphens'
      })
    })

    it('should return null for valid username', () => {
      const result = validateUsername('testuser')
      expect(result).toBeNull()
    })
  })

  describe('validateRegistrationForm', () => {
    it('should return valid for correct registration data', () => {
      const result = validateRegistrationForm('testuser', 'test@example.com', 'Password123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for incorrect username', () => {
      const result = validateRegistrationForm('ab', 'test@example.com', 'Password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('username')
    })

    it('should return invalid for incorrect email', () => {
      const result = validateRegistrationForm('testuser', 'invalid-email', 'Password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('email')
    })

    it('should return invalid for weak password', () => {
      const result = validateRegistrationForm('testuser', 'test@example.com', 'weak')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('password')
    })

    it('should return invalid for multiple errors', () => {
      const result = validateRegistrationForm('ab', 'invalid-email', 'weak')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(3)
    })
  })

  describe('validateLoginForm', () => {
    it('should return valid for correct login data', () => {
      const result = validateLoginForm('testuser', 'password123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for empty username', () => {
      const result = validateLoginForm('', 'password123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('username')
    })

    it('should return invalid for empty password', () => {
      const result = validateLoginForm('testuser', '')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('password')
    })

    it('should return invalid for both empty fields', () => {
      const result = validateLoginForm('', '')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })
})