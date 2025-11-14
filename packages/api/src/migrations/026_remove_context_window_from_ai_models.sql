-- Remove context_window column from ai_models table
-- Migration: 026_remove_context_window_from_ai_models.sql
-- Context window is set per calculation, not per model

-- Remove the column
ALTER TABLE ai_models
DROP COLUMN IF EXISTS context_window;

