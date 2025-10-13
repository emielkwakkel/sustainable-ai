# Token Calculator Feature

## Status: Todo

## Overview
Based on the research from [Anu's Substack article](https://anuragsridharan.substack.com/p/we-can-use-tokens-to-track-ais-carbon), this feature allows users to calculate the carbon emissions and energy consumption of AI model inference based on token usage.

## User Story

### As a developer or AI practitioner
I want to calculate the carbon footprint of my AI model usage based on token consumption
So that I can make informed decisions about model selection and usage patterns to reduce environmental impact

## Acceptance Criteria

### Core Functionality
- [ ] **Token Input**: User can input the number of tokens used in their AI inference
- [ ] **Model Selection**: User can select from predefined models (GPT-4, GPT-3.5, etc.) with pre-configured parameters
- [ ] **Configurable Parameters**: User can adjust key calculation assumptions:
  - Average context length (default: 8,000 tokens)
  - Average context window (default: 1,250 tokens) 
  - Data Center PUE (default: 1.1)
  - Hardware type (default: NVIDIA A100)
  - Data center region (default: Google Cloud Korea)
- [ ] **Real-time Calculation**: Results update automatically when parameters change
- [ ] **Multiple Output Formats**: Display results in both joules and kWh for energy, and grams CO₂ for emissions

### Calculation Accuracy
- [ ] **Energy per Token**: Calculate and display in both joules and kWh
- [ ] **Carbon Emissions per Token**: Calculate and display in grams CO₂
- [ ] **Total Emissions**: Calculate total emissions for the input token count
- [ ] **Verification**: Results should match the article's final estimate of ~0.09 grams CO₂ per token

### User Interface Requirements
- [ ] **Clean Input Form**: Intuitive form with labeled inputs and tooltips
- [ ] **Results Display**: Clear presentation of calculated values with units
- [ ] **Comparison View**: Show how results compare to common benchmarks (e.g., "equivalent to running a lightbulb for X minutes")
- [ ] **Export Functionality**: Allow users to export calculation results
- [ ] **Responsive Design**: Works on desktop and mobile devices

### Technical Requirements
- [ ] **Validation**: Input validation for all numeric fields
- [ ] **Error Handling**: Graceful handling of invalid inputs
- [ ] **Performance**: Calculations should be instant (< 100ms)
- [ ] **Accessibility**: Full keyboard navigation and screen reader support

## Detailed Calculation Formula

### Base Energy Calculation
```
Energy per token = (Model complexity factor × Context window factor × Hardware efficiency) × PUE adjustment
```

### Specific Formula Implementation
1. **Model Complexity Factor**: Based on model parameters (GPT-4: 280B parameters)
2. **Context Window Factor**: Accounts for attention mechanism complexity
3. **Hardware Efficiency**: NVIDIA A100 processing rate (1400 tokens/second at 400W)
4. **PUE Adjustment**: Data center overhead (default: 1.1)
5. **Carbon Intensity**: Regional grid carbon intensity (Korea: 0.459 kg CO₂/kWh)

### Expected Results (Verification)
- **Energy per token**: ~673.2 joules (0.000187 kWh)
- **Carbon emissions per token**: ~0.0859 grams CO₂
- **For 200 tokens**: ~1.8 grams CO₂ total

## Configuration Options

### Default Assumptions (from article)
- **Model**: GPT-4 (280B parameters)
- **Context Length**: 8,000 tokens
- **Context Window**: 1,250 tokens
- **Hardware**: NVIDIA A100 (400W, 1400 tokens/sec)
- **Data Center**: Google Cloud Korea
- **PUE**: 1.1
- **Carbon Intensity**: 0.459 kg CO₂/kWh

### Configurable Parameters
- **Model Selection**: Dropdown with predefined models
- **Context Length**: Slider/input (1,000 - 32,000 tokens)
- **Context Window**: Slider/input (500 - 2,000 tokens)
- **Hardware Type**: Dropdown (NVIDIA A100, V100, etc.)
- **Data Center Region**: Dropdown with PUE and carbon intensity
- **Custom PUE**: Manual input option
- **Custom Carbon Intensity**: Manual input option

## User Experience Flow

1. **Landing**: User navigates to Token Calculator page
2. **Model Selection**: User selects AI model from dropdown
3. **Token Input**: User enters number of tokens used
4. **Parameter Adjustment**: User can optionally adjust calculation parameters
5. **Results Display**: System shows calculated energy and emissions
6. **Comparison**: System shows contextual comparisons (e.g., "equivalent to X lightbulb minutes")
7. **Export**: User can export results for reporting

## Success Metrics
- **Accuracy**: Calculations match article's estimates within 5%
- **Usability**: Users can complete calculation in under 2 minutes
- **Adoption**: Feature used by 80% of dashboard users within first month
- **Feedback**: User satisfaction score > 4.5/5

## Technical Implementation Notes

### State Management
```typescript
interface TokenCalculatorState {
  model: string
  tokenCount: number
  contextLength: number
  contextWindow: number
  hardware: string
  dataCenter: string
  pue: number
  carbonIntensity: number
}
```

### Calculation Service
```typescript
interface CalculationResult {
  energyJoules: number
  energyKWh: number
  carbonEmissionsGrams: number
  totalEmissionsGrams: number
  equivalentLightbulbMinutes: number
}
```

### Validation Rules
- Token count: 1 - 1,000,000
- Context length: 1,000 - 32,000
- Context window: 100 - 2,000
- PUE: 1.0 - 3.0
- Carbon intensity: 0.0 - 1.0 kg CO₂/kWh

## Future Enhancements
- **Batch Calculations**: Calculate emissions for multiple inference sessions
- **Historical Tracking**: Track emissions over time
- **Model Comparison**: Compare emissions across different models
- **Optimization Suggestions**: Recommend parameter adjustments to reduce emissions
- **Integration**: Connect with actual API usage data
