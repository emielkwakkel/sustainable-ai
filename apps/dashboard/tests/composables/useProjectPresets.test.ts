import { describe, it, expect } from 'vitest'
import { useProjectPresets } from '~/composables/useProjectPresets'

describe('useProjectPresets', () => {
  it('should initialize with predefined presets', () => {
    const { getAllPresets } = useProjectPresets()
    
    const allPresets = getAllPresets()
    expect(allPresets).toHaveLength(6)
    expect(allPresets[0]?.id).toBe('gpt-4-token-research')
    expect(allPresets[1]?.id).toBe('cursor-ai')
  })

  it('should get preset by id', () => {
    const { getPresetById } = useProjectPresets()
    
    const preset = getPresetById('gpt-4-token-research')
    expect(preset).toBeDefined()
    expect(preset?.name).toBe('GPT-4 Token Research')
    expect(preset?.configuration.model).toBe('gpt-4')
  })

  it('should return undefined for invalid preset id', () => {
    const { getPresetById } = useProjectPresets()
    
    const preset = getPresetById('invalid-id')
    expect(preset).toBeUndefined()
  })

  it('should get preset name', () => {
    const { getPresetName } = useProjectPresets()
    
    expect(getPresetName('cursor-ai')).toBe('Cursor.ai')
    expect(getPresetName('invalid-id')).toBe('Unknown Preset')
  })

  it('should get preset description', () => {
    const { getPresetDescription } = useProjectPresets()
    
    expect(getPresetDescription('cursor-ai')).toContain('Cursor AI development')
    expect(getPresetDescription('invalid-id')).toBe('No description available')
  })

  it('should get preset configuration', () => {
    const { getPresetConfiguration } = useProjectPresets()
    
    const config = getPresetConfiguration('cursor-ai')
    expect(config).toBeDefined()
    expect(config?.model).toBe('gpt-4')
    expect(config?.contextLength).toBe(32000)
    expect(config?.contextWindow).toBe(2000)
  })

  it('should return undefined configuration for invalid preset', () => {
    const { getPresetConfiguration } = useProjectPresets()
    
    const config = getPresetConfiguration('invalid-id')
    expect(config).toBeUndefined()
  })

  it('should get all presets', () => {
    const { getAllPresets } = useProjectPresets()
    
    const allPresets = getAllPresets()
    expect(allPresets).toHaveLength(6)
    expect(allPresets.map(p => p.id)).toContain('gpt-4-token-research')
    expect(allPresets.map(p => p.id)).toContain('cursor-ai')
    expect(allPresets.map(p => p.id)).toContain('custom')
  })

  it('should have correct preset configurations', () => {
    const { getPresetConfiguration } = useProjectPresets()
    
    // Test GPT-4 Token Research preset
    const gpt4Config = getPresetConfiguration('gpt-4-token-research')
    expect(gpt4Config?.model).toBe('gpt-4')
    expect(gpt4Config?.contextLength).toBe(8000)
    expect(gpt4Config?.contextWindow).toBe(1250)
    
    // Test Cursor.ai preset
    const cursorConfig = getPresetConfiguration('cursor-ai')
    expect(cursorConfig?.model).toBe('gpt-4')
    expect(cursorConfig?.contextLength).toBe(32000)
    expect(cursorConfig?.contextWindow).toBe(2000)
    
    // Test Claude Research preset
    const claudeConfig = getPresetConfiguration('claude-research')
    expect(claudeConfig?.model).toBe('claude-3-opus')
    expect(claudeConfig?.contextLength).toBe(200000)
    expect(claudeConfig?.contextWindow).toBe(4000)
  })
})
