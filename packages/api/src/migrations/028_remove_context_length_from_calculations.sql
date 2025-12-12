-- Migration: 028_remove_context_length_from_calculations.sql
-- Remove context_length column from calculations table
-- Context length is only used in model definitions for validation
-- Calculations only need context_window (actual context being processed)

-- Remove the column
ALTER TABLE calculations
DROP COLUMN IF EXISTS context_length;

-- Note: Existing calculations with context_length will lose this data
-- This is acceptable as context_length is not used in calculations anymore
-- Only context_window is used for actual calculations

