-- Remove is_system column from presets table
-- Migration: 028_remove_is_system_from_presets.sql

-- Drop the index on is_system
DROP INDEX IF EXISTS idx_presets_is_system;

-- Drop the is_system column
ALTER TABLE presets DROP COLUMN IF EXISTS is_system;

