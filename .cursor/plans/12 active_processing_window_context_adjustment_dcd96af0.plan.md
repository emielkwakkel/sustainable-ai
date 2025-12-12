# Active Processing Window Context Adjustment

## Problem Statement

The current implementation uses the maximum context window (e.g., 150,000 tokens) for the context window adjustment factor, which applies a quadratic formula `(contextWindow / 2048)²`. This causes unrealistic energy calculations when most tokens are cache reads (which have minimal processing cost).

For example, with Composer-1:

- Input (w/o Cache): 29,839 tokens
- Cache Read: 246,016 tokens (weight 0.001)
- Output: 9,054 tokens
- Context Window: 150,000 tokens

The current formula treats all 150k tokens as actively processed, resulting in a 5,369x multiplier, when in reality most tokens are cached and don't require active attention processing.

## Solution

Use the **active processing window** (input tokens + output tokens, excluding cache reads) for context window adjustment when detailed token breakdown is available. Cache reads don't contribute to context window overhead since they're already cached and require minimal processing.

## Implementation

### 1. Update Core Calculation Logic

**File**: `packages/core/src/index.ts`

Modify the `calculateEmissions` method to calculate and use active processing window:

```typescript
// After calculating effectiveTokenCount (around line 87)
// Calculate active processing window for context adjustment
// Active window = tokens that require attention processing (exclude cache reads)
let effectiveContextWindow = params.contextWindow

if (shouldUseDetailedTokens) {
  const activeProcessingWindow = 
    (inputWithCache || 0) + 
    (inputWithoutCache || 0) + 
    (outputTokens || 0)
  
  // Use active processing window if it's meaningful (at least 100 tokens)
  // Otherwise fall back to provided contextWindow
  if (activeProcessingWindow >= 100) {
    effectiveContextWindow = activeProcessingWindow
  }
  // If active window is too small, use provided contextWindow as fallback
}

// Apply context window adjustment using effective context window
const GPT3_BASELINE_CONTEXT_WINDOW = 2048
const contextWindowFactor = Math.pow(effectiveContextWindow / GPT3_BASELINE_CONTEXT_WINDOW, 2)
const contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh * contextWindowFactor
```

**Key Changes**:

- Calculate `activeProcessingWindow` as sum of input (with/without cache) + output tokens
- Use active window for context adjustment when detailed tokens are available
- Fallback to provided `contextWindow` if active window is too small (< 100 tokens) or when detailed breakdown isn't available
- Update comments to explain the rationale

### 2. Update Documentation

**File**: `docs/context-window-adjustment.md` (new file)

Create comprehensive documentation explaining:

- The problem with maximum context window approach
- How active processing window works
- When it applies vs. falls back to provided context window
- Examples with Composer-1 calculations
- Rationale based on Cursor's caching strategy

**File**: `docs/research-paper-analysis.md`

Update the "Context Window Adjustment" section to mention:

- The active processing window optimization for models with caching
- Link to the new context-window-adjustment.md document

### 3. Update Tests

**File**: `packages/core/src/index.test.ts`

Add test cases for:

- Active processing window calculation with detailed tokens
- Fallback to provided contextWindow when active window is too small
- Verification that cache reads don't affect context window factor
- Comparison of results with/without active processing window

**Example test case**:

```typescript
it('should use active processing window for context adjustment when detailed tokens provided', () => {
  const formData = {
    tokenCount: 1000,
    model: 'composer-1',
    contextLength: 200000,
    contextWindow: 150000, // Maximum window
    inputWithoutCache: 29839,
    cacheRead: 246016,
    outputTokens: 9054,
    hardware: 'nvidia-a100',
    dataCenterProvider: 'google-cloud',
    dataCenterRegion: 'google-oregon'
  }
  
  const result = sustainableAICalculator.calculateFromFormData(formData)
  
  // Verify that context adjustment uses active window (29839 + 9054 = 38893)
  // instead of maximum window (150000)
  // This should result in more realistic energy values
  expect(result.energyKWh).toBeLessThan(100) // Should be realistic, not 92.97 GWh
})
```

### 4. Update Comments

**File**: `packages/core/src/index.ts`

Update the comment for context window adjustment to explain:

- Why we use active processing window for detailed token breakdowns
- How cache reads don't contribute to context overhead
- The fallback behavior

## Expected Impact

With the example input:

- **Before**: Context factor = (150,000 / 2,048)² ≈ 5,369x → 35.89 t CO₂, 92.97 GWh
- **After**: Context factor = (38,893 / 2,048)² ≈ 361x → More realistic values (~2-3 kg CO₂)

The active processing window (38,893 tokens) is much smaller than the maximum window (150,000 tokens), resulting in a more accurate energy calculation that reflects actual processing requirements.

## Backward Compatibility

- When detailed token breakdown is NOT provided, the calculation falls back to using the provided `contextWindow` parameter (existing behavior)
- All existing calculations without detailed tokens will continue to work as before
- Only calculations with detailed token breakdown will benefit from the active processing window optimization

## Validation

After implementation, verify:

1. Calculations without detailed tokens still use provided contextWindow
2. Calculations with detailed tokens use active processing window
3. Cache reads don't inflate context window factor
4. Results are more realistic for models like Composer-1 with large cache reads
5. Tests pass with new logic