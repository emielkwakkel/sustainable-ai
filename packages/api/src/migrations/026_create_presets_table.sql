-- Create Presets table
-- Migration: 026_create_presets_table.sql

-- Presets table
CREATE TABLE presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL,
    user_id VARCHAR(255), -- nullable for presets without a specific owner
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_presets_user_id ON presets(user_id);
CREATE INDEX idx_presets_configuration_gin ON presets USING GIN (configuration);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_presets_updated_at
    BEFORE UPDATE ON presets
    FOR EACH ROW
    EXECUTE FUNCTION update_presets_updated_at();

