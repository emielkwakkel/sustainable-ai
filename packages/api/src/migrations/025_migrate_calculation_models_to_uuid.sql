-- Migrate calculation model IDs from names to UUIDs
-- Migration: 025_migrate_calculation_models_to_uuid.sql

-- Update calculations table to use UUIDs instead of model names
-- This migration maps old model names to their UUIDs from the ai_models table

-- First, create a temporary mapping of model names to UUIDs
-- Handle case-insensitive matching and common name variations

-- Update 'gpt-4' to specific UUID: 70503bb6-2eed-4b7f-abaa-b0df643ebae3
UPDATE calculations c
SET model = '70503bb6-2eed-4b7f-abaa-b0df643ebae3'
WHERE LOWER(c.model) = 'gpt-4';

-- Update 'composer-1' to specific UUID: 70503bb6-2eed-4b7f-abaa-b0df643ebae3
UPDATE calculations c
SET model = '70503bb6-2eed-4b7f-abaa-b0df643ebae3'
WHERE LOWER(c.model) IN ('composer-1', 'composer 1');

-- Update other common model name variations to their UUIDs
-- GPT-3.5 Turbo variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) IN ('gpt-3.5 turbo', 'gpt-3.5-turbo', 'gpt-3.5 turbo')
    LIMIT 1
)
WHERE LOWER(c.model) IN ('gpt-3.5-turbo', 'gpt-3.5 turbo', 'gpt-3.5 turbo')
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) IN ('gpt-3.5 turbo', 'gpt-3.5-turbo')
);

-- Claude 3 Opus variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%claude%opus%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%claude%opus%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%claude%opus%'
);

-- Claude 3 Sonnet variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%claude%sonnet%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%claude%sonnet%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%claude%sonnet%'
);

-- Sonnet 4.5 variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%sonnet%4.5%' OR LOWER(name) LIKE '%sonnet%4%5%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%sonnet%4.5%' OR LOWER(c.model) LIKE '%sonnet%4%5%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%sonnet%4.5%' OR LOWER(name) LIKE '%sonnet%4%5%'
);

-- GPT-4o variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%gpt%4o%' OR LOWER(name) LIKE '%gpt-4o%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%gpt%4o%' OR LOWER(c.model) LIKE '%gpt-4o%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%gpt%4o%' OR LOWER(name) LIKE '%gpt-4o%'
);

-- GPT-4.1 variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%gpt%4.1%' OR LOWER(name) LIKE '%gpt%4%1%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%gpt%4.1%' OR LOWER(c.model) LIKE '%gpt%4%1%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%gpt%4.1%' OR LOWER(name) LIKE '%gpt%4%1%'
);

-- GPT-5 variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%gpt%5%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%gpt%5%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%gpt%5%'
);

-- Llama 2 70B variations
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) LIKE '%llama%70%' OR LOWER(name) LIKE '%llama%2%70%'
    LIMIT 1
)
WHERE LOWER(c.model) LIKE '%llama%70%' OR LOWER(c.model) LIKE '%llama%2%70%'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) LIKE '%llama%70%' OR LOWER(name) LIKE '%llama%2%70%'
);

-- Generic fallback: try to match any remaining model names case-insensitively
-- This handles any other variations we might have missed
UPDATE calculations c
SET model = (
    SELECT id::text 
    FROM ai_models 
    WHERE LOWER(name) = LOWER(c.model)
    LIMIT 1
)
WHERE c.model NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
AND EXISTS (
    SELECT 1 FROM ai_models WHERE LOWER(name) = LOWER(c.model)
);

-- Log any calculations that couldn't be migrated (for debugging)
-- These will remain with their original model names
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM calculations
    WHERE model NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
    
    IF unmigrated_count > 0 THEN
        RAISE NOTICE 'Warning: % calculations could not be migrated to UUIDs. These may need manual review.', unmigrated_count;
    END IF;
END $$;

