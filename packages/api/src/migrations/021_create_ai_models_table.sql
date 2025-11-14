-- Create AI Models table
-- Migration: 021_create_ai_models_table.sql

-- AI Models table
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parameters INTEGER NOT NULL, -- in billions
    context_length INTEGER NOT NULL,
    context_window INTEGER NOT NULL,
    token_weights JSONB, -- optional token weights: { inputWithCache, inputWithoutCache, cacheRead, outputTokens }
    complexity_factor DECIMAL(10,4) GENERATED ALWAYS AS (parameters / 175.0) STORED, -- auto-calculated relative to GPT-3 baseline
    pricing JSONB, -- optional pricing: { input, cachedInput, output }
    is_system BOOLEAN DEFAULT false, -- system models cannot be deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_model_name UNIQUE(name)
);

-- Create indexes for performance
CREATE INDEX idx_ai_models_name ON ai_models(name);
CREATE INDEX idx_ai_models_is_system ON ai_models(is_system);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_models_updated_at();

