import { describe, it, expect } from 'vitest'
import { useTokenCalculator } from '~/composables/useTokenCalculator'

describe('useTokenCalculator', () => {
  const { calculateEmissions, validateFormData, formatNumber } = useTokenCalculator()

  it('calculates emissions correctly for default GPT-4 configuration', () => {
    const formData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea'
    }

    const result = calculateEmissions(formData)

    // Verify the calculation matches expected values from the article
    // Note: PUE adjustment (1.1) is applied, so base energy * 1.1
    const expectedEnergyJoules = 673.2 * 1000 * 1.1 // Base energy * tokens * PUE
    expect(result.energyJoules).toBeCloseTo(expectedEnergyJoules, 0)
    expect(result.energyKWh).toBeCloseTo(expectedEnergyJoules / 3600000, 3)
    expect(result.carbonEmissionsGrams).toBeCloseTo(0.094, 2) // Calculated value with PUE adjustment
    expect(result.totalEmissionsGrams).toBeCloseTo(94.4, 1) // 0.094 * 1000
  })

  it('validates form data correctly', () => {
    const validData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea'
    }

    const validation = validateFormData(validData)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('rejects invalid token count', () => {
    const invalidData = {
      tokenCount: 0,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea'
    }

    const validation = validateFormData(invalidData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Token count must be between 1 and 1,000,000')
  })

  it('rejects invalid context length', () => {
    const invalidData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 500,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea'
    }

    const validation = validateFormData(invalidData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Context length must be between 1,000 and 32,000 tokens')
  })

  it('formats numbers correctly', () => {
    expect(formatNumber(123.456789, 2)).toBe('123.46')
    expect(formatNumber(0.001234, 4)).toBe('0.0012')
    expect(formatNumber(1000, 0)).toBe('1000')
  })

  it('calculates equivalent metrics correctly', () => {
    const formData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea'
    }

    const result = calculateEmissions(formData)

    // Lightbulb calculation: energy in kWh / 0.01 (10W lightbulb)
    const expectedLightbulbMinutes = (result.energyKWh * 1000) / 0.01
    expect(result.equivalentLightbulbMinutes).toBeCloseTo(expectedLightbulbMinutes, 1)

    // Car miles calculation: total emissions in kg / 2.3 (kg CO₂ per mile)
    const expectedCarMiles = (result.totalEmissionsGrams / 1000) * 2.3
    expect(result.equivalentCarMiles).toBeCloseTo(expectedCarMiles, 2)
  })
})
