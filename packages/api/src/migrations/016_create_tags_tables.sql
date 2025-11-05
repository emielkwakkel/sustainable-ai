-- Create tags and calculation_tags tables
-- Migration: 016_create_tags_tables.sql

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Calculation tags junction table
CREATE TABLE IF NOT EXISTS calculation_tags (
    calculation_id INTEGER NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (calculation_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX idx_tags_project_id ON tags(project_id);
CREATE INDEX idx_calculation_tags_calculation_id ON calculation_tags(calculation_id);
CREATE INDEX idx_calculation_tags_tag_id ON calculation_tags(tag_id);

