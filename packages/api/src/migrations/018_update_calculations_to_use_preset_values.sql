-- Migration: 018_update_calculations_to_use_preset_values.sql
-- Update all existing calculations to use NULL for context_length and context_window
-- when they match preset values (indicating no override)
-- This ensures consistency with the preset system

-- Set context_length and context_window to NULL for calculations that match preset values
-- This indicates they use the preset defaults (no override)
UPDATE calculations c
SET 
  context_length = NULL,
  context_window = NULL,
  updated_at = NOW()
FROM projects p
WHERE c.project_id = p.id
  AND (
    -- For cursor-ai preset: if values match (8000, 1250), set to NULL
    (p.calculation_preset_id = 'cursor-ai' AND c.context_length = 8000 AND c.context_window = 1250)
    OR
    -- For gpt-4-research preset: if values match (8000, 1250), set to NULL
    (p.calculation_preset_id = 'gpt-4-research' AND c.context_length = 8000 AND c.context_window = 1250)
    OR
    -- For any other preset or unknown preset, if values match cursor-ai defaults, set to NULL
    (p.calculation_preset_id NOT IN ('cursor-ai', 'gpt-4-research') AND c.context_length = 8000 AND c.context_window = 1250)
  );
