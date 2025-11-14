-- Migration: 019_update_auto_model_to_sonnet.sql
-- Update all calculations where model = 'Auto' to model = 'sonnet-4.5'

UPDATE calculations
SET model = 'sonnet-4.5',
    updated_at = NOW()
WHERE model = 'Auto';

