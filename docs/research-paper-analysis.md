# Research Paper Analysis: Token-Based Carbon Tracking

## Overview

This document analyzes the research paper "We can use 'tokens' to track AI's carbon emissions: here's how" by Anu Sridharan and identifies a mathematical inconsistency in the final calculations.

## Research Paper Reference

**Source**: [We can use "tokens" to track AI's carbon emissions: here's how](https://anuragsridharan.substack.com/p/we-can-use-tokens-to-track-ais-carbon)  
**Author**: Anu Sridharan  
**Date**: September 26, 2024

## Methodology Analysis

### Correct Calculations

The research paper correctly calculates the following values for GPT-4 with NVIDIA A100 GPU and Google Cloud Korea data center:

1. **Base Energy per Token (GPT-3)**: 0.4 kW ÷ 1400 tokens/sec = 0.0002857 kWh/token
2. **GPT-4 Complexity Factor**: 1.6x more complex than GPT-3
3. **GPT-4 Energy**: 0.0002857 × 1.6 = 0.0004571 kWh/token
4. **Context Window Adjustment**: 0.0004571 × 0.372 = 0.0001700 kWh/token
5. **PUE Adjustment**: 0.0001700 × 1.1 = 0.000187 kWh/token
6. **Energy per Token**: 0.000187 × 3,600,000 = **673.2 J/token**
7. **Carbon per Token**: 0.000187 × 0.459 × 1000 = **0.0859 g CO₂/token**

### Mathematical Inconsistency

The research paper contains an internal inconsistency in its final summary:

**Research Paper Claims:**
- Per token: 0.0859 g CO₂/token ✅ (Correct)
- For 200 tokens: ~1.8 g CO₂ total ❌ (Incorrect)

**Mathematical Reality:**
- 0.0859 g CO₂/token × 200 tokens = **17.18 g CO₂ total**

## Implementation in Our Calculator

Our token calculator correctly implements the research paper's methodology:

### Calculation Flow
1. **Base Energy**: GPU Power (kW) ÷ Tokens per second
2. **Complexity Adjustment**: Base energy × Model complexity factor
3. **Context Window Adjustment**: 
   - GPT-4 with 1250 token window: 0.372 factor (from research)
   - Other models: Square root scaling
4. **PUE Adjustment**: Context-adjusted energy × PUE
5. **Carbon Calculation**: Final energy × Carbon intensity

### Verification
Our implementation produces the exact values from the research paper:
- ✅ **Energy per token**: 673.2 J
- ✅ **Carbon per token**: 0.0859 g CO₂
- ✅ **For 200 tokens**: 17.18 g CO₂ (mathematically correct)

## Conclusion

The research paper's methodology is sound and mathematically correct. However, the final summary contains an error where it claims 200 tokens would produce ~1.8 g CO₂ total, when the correct calculation based on their own per-token value is 17.18 g CO₂.

Our calculator implementation follows the research paper's proven methodology and produces mathematically consistent results. The discrepancy in the research paper's final summary does not affect the accuracy of our calculations.

## References

- [Original Research Paper](https://anuragsridharan.substack.com/p/we-can-use-tokens-to-track-ais-carbon)
- [Electricity Maps API](https://portal.electricitymaps.com/developer-hub/api/getting-started#introduction)
- [WattTime API](https://www.watttime.org/api-documentation/)

## Technical Notes

- **GPU**: NVIDIA A100 (400W, 1400 tokens/sec)
- **Data Center**: Google Cloud Korea (PUE: 1.1, Carbon Intensity: 0.459 kg CO₂/kWh)
- **Model**: GPT-4 (280B parameters, 1.6x complexity factor)
- **Context Window**: 1250 tokens (0.372 adjustment factor)
