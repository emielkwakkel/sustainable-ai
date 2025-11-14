-- Migrate hardcoded models to database
-- Migration: 022_migrate_hardcoded_models.sql

-- Insert models from packages/config/src/models.ts
-- All models are marked as system models (is_system = true)

-- GPT-4
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES ('GPT-4', 280, 8000, 1250, NULL, true)
ON CONFLICT (name) DO NOTHING;

-- GPT-3.5 Turbo (with pricing)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, pricing, is_system)
VALUES (
  'GPT-3.5 Turbo',
  175,
  4000,
  1000,
  NULL,
  '{"input": 0.50, "cachedInput": 0.00, "output": 1.50}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Claude 3 Opus
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES ('Claude 3 Opus', 200, 200000, 2000, NULL, true)
ON CONFLICT (name) DO NOTHING;

-- Claude 3 Sonnet
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES ('Claude 3 Sonnet', 100, 200000, 1500, NULL, true)
ON CONFLICT (name) DO NOTHING;

-- Llama 2 70B
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES ('Llama 2 70B', 70, 4096, 1000, NULL, true)
ON CONFLICT (name) DO NOTHING;

-- Sonnet 4.5 (with token weights)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES (
  'Sonnet 4.5',
  100,
  200000,
  1500,
  '{"inputWithCache": 1.25, "inputWithoutCache": 1.00, "cacheRead": 0.10, "outputTokens": 5.00}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Composer 1 (with token weights)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, is_system)
VALUES (
  'Composer 1',
  100,
  200000,
  1500,
  '{"inputWithCache": 1.25, "inputWithoutCache": 1.00, "cacheRead": 0.10, "outputTokens": 5.00}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- GPT-4o (from pricing.ts, not in models.ts but referenced in TokenSimulatorSummary)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, pricing, is_system)
VALUES (
  'GPT-4o',
  280, -- Assuming similar to GPT-4
  8000, -- Assuming similar to GPT-4
  1250, -- Assuming similar to GPT-4
  NULL,
  '{"input": 2.50, "cachedInput": 1.25, "output": 10.00}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- GPT-4.1 (from pricing.ts)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, pricing, is_system)
VALUES (
  'GPT-4.1',
  280, -- Assuming similar to GPT-4
  8000, -- Assuming similar to GPT-4
  1250, -- Assuming similar to GPT-4
  NULL,
  '{"input": 2.00, "cachedInput": 0.50, "output": 8.00}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- GPT-5 (from pricing.ts)
INSERT INTO ai_models (name, parameters, context_length, context_window, token_weights, pricing, is_system)
VALUES (
  'GPT-5',
  350, -- Estimated larger than GPT-4
  8000, -- Assuming similar to GPT-4
  1250, -- Assuming similar to GPT-4
  NULL,
  '{"input": 1.25, "cachedInput": 0.13, "output": 10.00}'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

