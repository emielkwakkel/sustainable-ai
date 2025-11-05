-- Fix ambiguous column reference in database functions
-- Migration: 006_fix_function_ambiguity.sql

-- Drop and recreate the analytics function with proper column references
DROP FUNCTION IF EXISTS get_project_analytics(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION get_project_analytics(
    p_project_id INTEGER,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
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
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fix the timeline function as well
DROP FUNCTION IF EXISTS get_project_emissions_timeline(INTEGER, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR);

CREATE OR REPLACE FUNCTION get_project_emissions_timeline(
    p_project_id INTEGER,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    interval_type VARCHAR(10) DEFAULT 'day'
) RETURNS TABLE (
    period TIMESTAMP WITH TIME ZONE,
    total_emissions_grams DECIMAL,
    total_energy_joules DECIMAL,
    calculation_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN interval_type = 'hour' THEN DATE_TRUNC('hour', c.created_at)
            WHEN interval_type = 'day' THEN DATE_TRUNC('day', c.created_at)
            WHEN interval_type = 'week' THEN DATE_TRUNC('week', c.created_at)
            WHEN interval_type = 'month' THEN DATE_TRUNC('month', c.created_at)
            ELSE DATE_TRUNC('day', c.created_at)
        END as period,
        COALESCE(SUM((c.results->>'totalEmissionsGrams')::DECIMAL), 0) as total_emissions_grams,
        COALESCE(SUM((c.results->>'energyJoules')::DECIMAL), 0) as total_energy_joules,
        COUNT(c.id) as calculation_count
    FROM calculations c
    WHERE c.project_id = p_project_id
    AND (start_date IS NULL OR c.created_at >= start_date)
    AND (end_date IS NULL OR c.created_at <= end_date)
    GROUP BY period
    ORDER BY period;
END;
$$ LANGUAGE plpgsql;




