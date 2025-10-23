-- Create database functions for Projects feature
-- Migration: 002_create_database_functions.sql

-- Recalculation function
CREATE OR REPLACE FUNCTION recalculate_project_emissions(
    project_uuid UUID,
    new_algorithm_version VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    calculation_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR calculation_record IN 
        SELECT id, calculation_parameters, results
        FROM calculations 
        WHERE project_id = project_uuid
    LOOP
        -- Update calculation with new algorithm
        UPDATE calculations 
        SET 
            results = jsonb_set(
                results, 
                '{calculationVersion}', 
                to_jsonb(new_algorithm_version)
            ),
            updated_at = NOW()
        WHERE id = calculation_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Analytics aggregation function
CREATE OR REPLACE FUNCTION get_project_analytics(
    project_uuid UUID,
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
    WHERE project_id = project_uuid
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get project emissions over time
CREATE OR REPLACE FUNCTION get_project_emissions_timeline(
    project_uuid UUID,
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
    WHERE c.project_id = project_uuid
    AND (start_date IS NULL OR c.created_at >= start_date)
    AND (end_date IS NULL OR c.created_at <= end_date)
    GROUP BY period
    ORDER BY period;
END;
$$ LANGUAGE plpgsql;
