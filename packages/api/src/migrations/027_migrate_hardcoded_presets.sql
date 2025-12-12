-- Migrate hardcoded presets to database
-- Migration: 027_migrate_hardcoded_presets.sql

-- Insert presets from packages/config/src/presets.ts
-- All presets have user_id = NULL (no specific owner)
-- Convert model names to UUIDs by looking up in ai_models table
-- Note: IDs will be auto-generated as UUIDs, but we'll use a deterministic approach
-- by checking if presets with these names already exist

-- GPT-4 Token Research preset
INSERT INTO presets (name, description, configuration, user_id)
SELECT 
    'GPT-4 Token Research',
    'Based on Anu''s Substack article "We can use tokens to track AI''s carbon"',
    jsonb_build_object(
        'tokenCount', 200,
        'model', (SELECT id::text FROM ai_models WHERE LOWER(name) = 'gpt-4' LIMIT 1),
        'contextLength', 8000,
        'contextWindow', 1250,
        'hardware', 'nvidia-a100',
        'dataCenterProvider', 'aws',
        'dataCenterRegion', 'aws-asia-pacific-tokyo',
        'customPue', 1.1,
        'customCarbonIntensity', NULL
    ),
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM presets WHERE name = 'GPT-4 Token Research' AND user_id IS NULL
);

-- Cursor.ai preset
INSERT INTO presets (name, description, configuration, user_id)
SELECT 
    'Cursor.ai',
    'Based on Cursor''s actual infrastructure as reported in The Pragmatic Engineer',
    jsonb_build_object(
        'tokenCount', 1000,
        'model', (SELECT id::text FROM ai_models WHERE LOWER(name) = 'gpt-4' LIMIT 1),
        'contextLength', 8000,
        'contextWindow', 1250,
        'hardware', 'nvidia-h100',
        'dataCenterProvider', 'azure',
        'dataCenterRegion', 'azure-virginia',
        'customPue', NULL,
        'customCarbonIntensity', NULL
    ),
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM presets WHERE name = 'Cursor.ai' AND user_id IS NULL
);

