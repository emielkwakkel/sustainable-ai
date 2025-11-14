-- Migration: 020_split_calculation_parameters.sql
-- Split calculation_parameters JSONB into separate columns for better querying and type safety

-- Add new columns to calculations table
ALTER TABLE calculations
ADD COLUMN IF NOT EXISTS cache_read INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS input_with_cache INTEGER,
ADD COLUMN IF NOT EXISTS input_without_cache INTEGER;

-- Migrate existing data from calculation_parameters JSONB to new columns
-- Extract values from JSONB, handling various field name formats
UPDATE calculations
SET 
  cache_read = COALESCE(
    (calculation_parameters->>'cacheRead')::INTEGER,
    (calculation_parameters->>'cache_read')::INTEGER,
    0
  ),
  output_tokens = COALESCE(
    (calculation_parameters->>'outputTokens')::INTEGER,
    (calculation_parameters->>'output_tokens')::INTEGER,
    0
  ),
  input_with_cache = COALESCE(
    (calculation_parameters->>'inputWithCache')::INTEGER,
    (calculation_parameters->>'input_with_cache')::INTEGER,
    0
  ),
  input_without_cache = COALESCE(
    (calculation_parameters->>'inputWithoutCache')::INTEGER,
    (calculation_parameters->>'input_without_cache')::INTEGER,
    0
  ),
  updated_at = NOW()
WHERE calculation_parameters IS NOT NULL
  AND calculation_parameters != '{}'::jsonb;

-- Note: We keep calculation_parameters JSONB column for backward compatibility
-- It can be removed in a future migration after all code paths are updated

