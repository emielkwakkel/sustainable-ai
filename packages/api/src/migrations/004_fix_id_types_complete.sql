-- Fix ID types to match frontend expectations - Complete version
-- Migration: 004_fix_id_types_complete.sql

-- Drop views first
DROP VIEW IF EXISTS project_summary;
DROP VIEW IF EXISTS monthly_emissions;

-- Drop foreign key constraints
ALTER TABLE calculations DROP CONSTRAINT IF EXISTS calculations_project_id_fkey;
ALTER TABLE cursor_imports DROP CONSTRAINT IF EXISTS cursor_imports_project_id_fkey;

-- Drop existing tables and recreate with correct types
DROP TABLE IF EXISTS calculations CASCADE;
DROP TABLE IF EXISTS cursor_imports CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Recreate projects table with integer ID and string user_id
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_preset_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id VARCHAR(255) NOT NULL
);

-- Recreate calculations table
CREATE TABLE calculations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    token_count INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL,
    context_length INTEGER,
    context_window INTEGER,
    hardware VARCHAR(100),
    data_center_provider VARCHAR(100),
    data_center_region VARCHAR(100),
    custom_pue DECIMAL(3,2),
    custom_carbon_intensity DECIMAL(6,4),
    calculation_parameters JSONB,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate cursor_imports table
CREATE TABLE cursor_imports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_data JSONB NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- Recreate user_settings table
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    cursor_api_token TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

CREATE INDEX idx_calculations_project_id ON calculations(project_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at);
CREATE INDEX idx_calculations_model ON calculations(model);
CREATE INDEX idx_calculations_results_gin ON calculations USING GIN (results);

CREATE INDEX idx_cursor_imports_project_id ON cursor_imports(project_id);
CREATE INDEX idx_cursor_imports_date_range ON cursor_imports(start_date, end_date);
CREATE INDEX idx_cursor_imports_raw_data_gin ON cursor_imports USING GIN (raw_data);

-- Recreate views for analytics
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at,
    COUNT(c.id) as calculation_count,
    COALESCE(SUM((c.results->>'totalEmissionsGrams')::DECIMAL), 0) as total_emissions_grams,
    COALESCE(SUM((c.results->>'energyJoules')::DECIMAL), 0) as total_energy_joules,
    COALESCE(AVG((c.results->>'carbonEmissionsGrams')::DECIMAL), 0) as avg_emissions_per_token
FROM projects p
LEFT JOIN calculations c ON p.id = c.project_id
GROUP BY p.id, p.name, p.description, p.created_at;

-- Monthly emissions view
CREATE VIEW monthly_emissions AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    DATE_TRUNC('month', c.created_at) as month,
    COALESCE(SUM((c.results->>'totalEmissionsGrams')::DECIMAL), 0) as monthly_emissions_grams,
    COALESCE(SUM((c.results->>'energyJoules')::DECIMAL), 0) as monthly_energy_joules,
    COUNT(c.id) as calculation_count
FROM projects p
JOIN calculations c ON p.id = c.project_id
GROUP BY p.id, p.name, DATE_TRUNC('month', c.created_at);



