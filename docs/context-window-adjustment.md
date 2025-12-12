# Context Window Adjustment: Skipping for Weighted Tokens

## Problem Statement

The original implementation applied context window adjustment (quadratic formula `(contextWindow / 2048)²`) to all calculations, including those using weighted tokens. This causes unrealistic energy calculations because:

1. **Double-counting overhead**: Weighted tokens already account for processing complexity and overhead
2. **Large multipliers**: With large context windows (e.g., 150,000 tokens), the quadratic formula produces huge multipliers (5,369x)
3. **Unrealistic results**: Even with active processing window (38,893 tokens), a 361x multiplier on top of weighted tokens still produces unrealistic values

### Example: Composer-1 Model

Consider a calculation with Composer-1 that has:
- **Input (w/o Cache)**: 29,839 tokens
- **Cache Read**: 246,016 tokens (weight 0.001)
- **Output Tokens**: 9,054 tokens
- **Weighted Token Count**: 75,355 tokens
- **Context Window**: 150,000 tokens (maximum available)

**Problem Evolution**:
1. **Original**: Context factor `(150,000 / 2,048)² ≈ 5,369x` → **35.89 t CO₂**, **92.97 GWh**
2. **With Active Window**: Context factor `(38,893 / 2,048)² ≈ 361x` → **2.41 t CO₂**, **6.25 GWh** (still unrealistic)
3. **Solution**: Skip context adjustment entirely when using weighted tokens → **Realistic values**

## Solution: Skip Context Window Adjustment for Weighted Tokens

We now **skip context window adjustment entirely** when using weighted tokens (detailed token breakdown). This is because:

1. **Weighted tokens already account for overhead**: Token weights reflect processing complexity:
   - Cache reads: 0.001 weight (minimal processing, no attention overhead)
   - Input tokens: 1.0 weight (standard attention processing)
   - Output tokens: 5.0 weight (generation is more energy-intensive)

2. **No double-counting**: Applying context window adjustment on top of weighted tokens would double-count the attention mechanism overhead

3. **Research paper context**: The context window adjustment from the research paper was designed for simple token counts, not weighted tokens that already account for processing differences

### How It Works

1. **With Weighted Tokens**: Skip context window adjustment entirely
   - Use complexity-adjusted energy directly
   - Apply PUE and carbon intensity adjustments
   - Multiply by weighted token count

2. **Without Weighted Tokens**: Apply context window adjustment as per research paper
   - Use quadratic formula: `(contextWindow / 2048)²`
   - This accounts for attention mechanism overhead scaling with context size

### Example Calculation

With the same Composer-1 input:
- **Weighted Token Count**: 75,355 tokens
- **Context Adjustment**: **Skipped** (using weighted tokens)
- **Result**: Realistic values based on weighted token processing costs

## Rationale

### Why Skip Context Adjustment for Weighted Tokens?

The context window adjustment from the research paper accounts for attention mechanism overhead scaling quadratically with context size. However, when using weighted tokens:

1. **Token weights already reflect processing costs**:
   - Cache reads (0.001 weight): Minimal processing, no attention overhead
   - Input tokens (1.0 weight): Standard attention processing
   - Output tokens (5.0 weight): Generation requires more energy

2. **Double-counting problem**: Applying context window adjustment on top of weighted tokens would multiply overhead twice:
   - Once through token weights (reflecting actual processing costs)
   - Once through context adjustment (reflecting attention mechanism scaling)

3. **Research paper design**: The original research paper's context window adjustment was designed for simple token counts where all tokens have equal processing cost. With weighted tokens, this assumption no longer holds.

### Cursor's Hybrid Caching Strategy

Cursor.ai's Composer-1 model uses an aggressive caching strategy:

- **Default Context**: Normal operational context window is around 200k tokens
- **RAG + Caching**: System pulls candidate context via RAG, then truncates to fit the model's maximum window
- **Aggressive Caching**: File data, embeddings, and search results are cached on the backend
- **Cache Reads**: Subsequent requests reuse cached data, resulting in faster responses and lower costs

The weighted token system already accounts for this caching strategy through token weights, so additional context window adjustment is unnecessary and leads to unrealistic results.

## Implementation Details

### When Context Adjustment is Skipped

Context window adjustment is **skipped** when:
- Detailed token breakdown is provided (inputWithCache, inputWithoutCache, cacheRead, outputTokens)
- Weighted tokens are being used for the calculation

### When Context Adjustment is Applied

Context window adjustment is **applied** when:
- Detailed token breakdown is NOT provided
- Simple token count is used (all tokens have equal processing cost)
- This follows the research paper methodology for standard token counts

### Code Location

The implementation is in `packages/core/src/index.ts` in the `calculateEmissions` method:

```typescript
// Apply context window adjustment
// IMPORTANT: When using weighted tokens, we skip context window adjustment
// because weighted tokens already account for processing complexity and overhead.
let contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh

if (!shouldUseDetailedTokens) {
  // Apply context window adjustment only when NOT using weighted tokens
  const GPT3_BASELINE_CONTEXT_WINDOW = 2048
  const contextWindowFactor = Math.pow(params.contextWindow / GPT3_BASELINE_CONTEXT_WINDOW, 2)
  contextAdjustedEnergyKwh = complexityAdjustedEnergyKwh * contextWindowFactor
}
```

## Impact

### Evolution of the Solution

1. **Original (Maximum Context Window)**:
   - Context factor: `(150,000 / 2,048)² ≈ 5,369x`
   - Result: **35.89 t CO₂**, **92.97 GWh** ❌

2. **With Active Processing Window**:
   - Context factor: `(38,893 / 2,048)² ≈ 361x`
   - Result: **2.41 t CO₂**, **6.25 GWh** ❌ (still unrealistic)

3. **Final Solution (Skip Context Adjustment)**:
   - Context factor: **None** (skipped for weighted tokens)
   - Result: **Realistic values** based on weighted token processing costs ✅

The key insight is that weighted tokens already account for processing complexity and overhead, so applying context window adjustment on top would double-count this overhead, leading to unrealistic results.

## Backward Compatibility

- ✅ Calculations without detailed tokens continue to use the provided `contextWindow` parameter
- ✅ All existing calculations without detailed tokens work as before
- ✅ Only calculations with detailed token breakdown benefit from the active processing window optimization

## References

- [Research Paper Analysis](./research-paper-analysis.md) - Original methodology
- [Cursor.ai Documentation](https://cursor.ai) - Composer-1 caching strategy
- Original research paper: [We can use "tokens" to track AI's carbon emissions](https://anuragsridharan.substack.com/p/we-can-use-tokens-to-track-ais-carbon)

