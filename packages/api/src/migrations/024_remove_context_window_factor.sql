-- Remove context_window_factor column from ai_models table
-- Migration: 024_remove_context_window_factor.sql
-- The context window factor is now calculated dynamically: (contextWindow / 2048)²

-- Remove the column
ALTER TABLE ai_models
DROP COLUMN IF EXISTS context_window_factor;

