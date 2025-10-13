import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validatePassword, 
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

  describe('validateRegistrationForm', () => {
    it('should return valid for correct registration data', () => {
      const result = validateRegistrationForm('test@example.com', 'Password123!')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for incorrect email', () => {
      const result = validateRegistrationForm('invalid-email', 'Password123!')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('email')
    })

    it('should return invalid for weak password', () => {
      const result = validateRegistrationForm('test@example.com', 'weak')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('password')
    })

    it('should return invalid for both email and password errors', () => {
      const result = validateRegistrationForm('invalid-email', 'weak')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
    })
  })

  describe('validateLoginForm', () => {
    it('should return valid for correct login data', () => {
      const result = validateLoginForm('test@example.com', 'password123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for empty email', () => {
      const result = validateLoginForm('', 'password123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.field).toBe('email')
    })

    it('should return invalid for empty password', () => {
      const result = validateLoginForm('test@example.com', '')
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