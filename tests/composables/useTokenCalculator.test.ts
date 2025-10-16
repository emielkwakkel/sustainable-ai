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

    // Calculate expected energy using the corrected formula from research paper
    // Base energy per token = GPU Power (kW) / Tokens per second
    // NVIDIA A100: 400W = 0.4kW, 1400 tokens/sec
    // Base energy: 0.4 / 1400 = 0.0002857 kWh/token
    // GPT-4 complexity factor: 1.6
    // Complexity adjusted: 0.0002857 * 1.6 = 0.0004571 kWh/token
    // Context window factor: 0.372 (for 1250 token window)
    // Context adjusted: 0.0004571 * 0.372 = 0.0001700 kWh/token
    // With PUE (1.1): 0.0001700 * 1.1 = 0.000187 kWh/token
    // Convert to joules: 0.000187 * 3600000 = 673.2 J/token
    const expectedEnergyPerTokenJoules = (0.4 / 1400) * 1.6 * 0.372 * 1.1 * 3600000
    const expectedEnergyJoules = expectedEnergyPerTokenJoules * 1000
    expect(result.energyJoules).toBeCloseTo(expectedEnergyJoules, 0)
    expect(result.energyKWh).toBeCloseTo(expectedEnergyJoules / 3600000, 3)
    
    // Calculate expected carbon emissions dynamically
    const expectedEnergyPerTokenKwh = (0.4 / 1400) * 1.6 * 0.372 * 1.1
    const expectedCarbonPerTokenGrams = expectedEnergyPerTokenKwh * 0.459 * 1000
    expect(result.carbonEmissionsGrams).toBeCloseTo(expectedCarbonPerTokenGrams, 3)
    expect(result.totalEmissionsGrams).toBeCloseTo(expectedCarbonPerTokenGrams * 1000, 1)
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

  it('calculates carbon emissions dynamically based on carbon intensity', () => {
    const formData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenter: 'google-korea',
      customCarbonIntensity: 0.2 // Lower carbon intensity
    }

    const result = calculateEmissions(formData)

    // With custom carbon intensity of 0.2 kg CO₂/kWh
    // Energy per token: (0.4 / 1400) * 1.6 * 0.372 * 1.1 = 0.000187 kWh/token
    // Carbon per token: 0.000187 * 0.2 = 0.0000374 kg CO₂/token = 0.0374 g CO₂/token
    const expectedCarbonPerTokenGrams = (0.4 / 1400) * 1.6 * 0.372 * 1.1 * 0.2 * 1000
    expect(result.carbonEmissionsGrams).toBeCloseTo(expectedCarbonPerTokenGrams, 3)
    expect(result.totalEmissionsGrams).toBeCloseTo(expectedCarbonPerTokenGrams * 1000, 1)
  })

  it('calculates energy correctly for different models and hardware', () => {
    // Test GPT-3.5 Turbo (baseline complexity) with NVIDIA V100
    const formData = {
      tokenCount: 1000,
      model: 'gpt-3.5-turbo',
      contextLength: 4000,
      contextWindow: 1000,
      hardware: 'nvidia-v100',
      dataCenter: 'google-korea'
    }

    const result = calculateEmissions(formData)

    // NVIDIA V100: 300W = 0.3kW, 800 tokens/sec
    // Base energy: 0.3 / 800 = 0.000375 kWh/token
    // GPT-3.5 complexity factor: 1.0 (baseline)
    // Complexity adjusted: 0.000375 * 1.0 = 0.000375 kWh/token
    // Context window factor: 1.0 (for 1000 token window, same as default)
    // Context adjusted: 0.000375 * 1.0 = 0.000375 kWh/token
    // With PUE (1.1): 0.000375 * 1.1 = 0.0004125 kWh/token
    const expectedEnergyPerTokenKwh = (0.3 / 800) * 1.0 * 1.0 * 1.1
    const expectedEnergyJoules = expectedEnergyPerTokenKwh * 3600000 * 1000
    expect(result.energyJoules).toBeCloseTo(expectedEnergyJoules, 0)
  })
})
