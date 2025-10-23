import { describe, it, expect } from 'vitest'
import { sustainableAICalculator } from './index'

describe('sustainableAICalculator', () => {
  it('should be defined', () => {
    expect(sustainableAICalculator).toBeDefined()
  })

  it('should have calculateFromFormData method', () => {
    expect(sustainableAICalculator.calculateFromFormData).toBeDefined()
    expect(typeof sustainableAICalculator.calculateFromFormData).toBe('function')
  })

  it('should calculate emissions for basic form data', () => {
    const formData = {
      tokenCount: 1000,
      model: 'gpt-4',
      contextLength: 8000,
      contextWindow: 1250,
      hardware: 'nvidia-a100',
      dataCenterProvider: 'google-cloud',
      dataCenterRegion: 'google-oregon'
    }

    const result = sustainableAICalculator.calculateFromFormData(formData)

    expect(result).toBeDefined()
    expect(result.energyJoules).toBeGreaterThan(0)
    expect(result.energyKWh).toBeGreaterThan(0)
    expect(result.carbonEmissionsGrams).toBeGreaterThan(0)
    expect(result.totalEmissionsGrams).toBeGreaterThan(0)
  })
})
