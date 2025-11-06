-- Migration: 017_update_projects_to_cursor_ai_preset.sql
-- Update all existing projects to use the 'cursor-ai' preset
-- This migration aligns projects with the new preset system from usePresets

-- Map old preset IDs to new 'cursor-ai' preset
-- This updates all projects that don't already have 'cursor-ai' or 'gpt-4-research' presets
UPDATE projects
SET calculation_preset_id = 'cursor-ai',
    updated_at = NOW()
WHERE calculation_preset_id NOT IN ('cursor-ai', 'gpt-4-research')
   OR calculation_preset_id IS NULL;

-- Also handle the case where old preset IDs might exist
-- Map common old preset IDs to cursor-ai
UPDATE projects
SET calculation_preset_id = 'cursor-ai',
    updated_at = NOW()
WHERE calculation_preset_id IN (
  'gpt-4-token-research',
  'claude-research',
  'llama-experiments',
  'general-ai-usage',
  'custom'
);

