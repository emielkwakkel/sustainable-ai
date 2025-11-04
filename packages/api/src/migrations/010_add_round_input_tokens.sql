-- Add actual input tokens field to rounds table
-- Migration: 010_add_round_input_tokens.sql

-- Add column to store actual input tokens (accounting for multi-agent accumulation)
ALTER TABLE rounds ADD COLUMN IF NOT EXISTS actual_input_tokens INTEGER DEFAULT 0;

-- Update existing rounds to have actual_input_tokens = prompt_tokens (for backwards compatibility)
UPDATE rounds SET actual_input_tokens = prompt_tokens WHERE actual_input_tokens = 0;

