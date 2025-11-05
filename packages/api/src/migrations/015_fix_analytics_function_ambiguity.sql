-- Fix function ambiguity by dropping all versions and creating a single clean version
-- Migration: 015_fix_analytics_function_ambiguity.sql

-- Drop all existing versions of get_project_analytics
DROP FUNCTION IF EXISTS get_project_analytics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_project_analytics(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_project_analytics(INTEGER);
DROP FUNCTION IF EXISTS get_project_analytics(UUID);

-- Create a single clean version with INTEGER parameter
CREATE OR REPLACE FUNCTION get_project_analytics(
    p_project_id INTEGER,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalEmissionsGrams', COALESCE(SUM((results->>'totalEmissionsGrams')::DECIMAL), 0),
        'totalEnergyJoules', COALESCE(SUM((results->>'energyJoules')::DECIMAL), 0),
        'averageEmissionsPerToken', COALESCE(AVG((results->>'carbonEmissionsGrams')::DECIMAL), 0),
        'calculationCount', COUNT(*),
        'dateRange', jsonb_build_object(
            'start', MIN(created_at),
            'end', MAX(created_at)
        )
    ) INTO result
    FROM calculations
    WHERE project_id = p_project_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

