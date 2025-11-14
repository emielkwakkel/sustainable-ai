# Practical estimation formula

A widely accepted approximation (based on FLOP/token research such as from OpenAI, HuggingFace, Anthropic, and Stanford Center for Research on Foundation Models):

Approx FLOP multipliers

1× for input tokens without cache write
~1.5× for input tokens with cache write
~0.1× for cache-read tokens
3–5× for output tokens (depends on model family)

A practical working formula for Cursor / composer-1:

```
weighted_tokens =
    1.25 * Input (w/ Cache Write)
  + 1.00 * Input (w/o Cache Write)
  + 0.10 * Cache Read
  + 5.00 * Output Tokens
```

You can tune the multipliers later if you obtain FLOP/token metrics for composer-1.

Fields: 
* Input (w/ Cache Write)
* Input (w/o Cache Write)
* Cache Read
* Output Tokens