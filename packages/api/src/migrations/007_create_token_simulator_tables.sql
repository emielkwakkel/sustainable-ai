-- Create Token Simulator feature tables
-- Migration: 007_create_token_simulator_tables.sql

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    display_order INTEGER NOT NULL DEFAULT 0
);

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(chat_id, round_number)
);

-- Agent responses table
CREATE TABLE IF NOT EXISTS agent_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, agent_id)
);

-- Chat summary table (calculated fields)
CREATE TABLE IF NOT EXISTS chat_summaries (
    chat_id UUID PRIMARY KEY REFERENCES chats(id) ON DELETE CASCADE,
    total_input_tokens INTEGER NOT NULL DEFAULT 0,
    total_output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    gpt35_input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt35_output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt35_total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    gpt4o_total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);

CREATE INDEX IF NOT EXISTS idx_agents_chat_id ON agents(chat_id);
CREATE INDEX IF NOT EXISTS idx_agents_display_order ON agents(chat_id, display_order);

CREATE INDEX IF NOT EXISTS idx_rounds_chat_id ON rounds(chat_id);
CREATE INDEX IF NOT EXISTS idx_rounds_round_number ON rounds(chat_id, round_number);

CREATE INDEX IF NOT EXISTS idx_agent_responses_round_id ON agent_responses(round_id);
CREATE INDEX IF NOT EXISTS idx_agent_responses_agent_id ON agent_responses(agent_id);

-- Function to calculate total tokens for a chat
CREATE OR REPLACE FUNCTION calculate_chat_tokens(chat_uuid UUID)
RETURNS TABLE (
    total_input_tokens INTEGER,
    total_output_tokens INTEGER,
    total_tokens INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(r.prompt_tokens), 0)::INTEGER as total_input_tokens,
        COALESCE(SUM(ar.token_count), 0)::INTEGER as total_output_tokens,
        COALESCE(SUM(r.prompt_tokens), 0)::INTEGER + COALESCE(SUM(ar.token_count), 0)::INTEGER as total_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update chat summary
CREATE OR REPLACE FUNCTION update_chat_summary(chat_uuid UUID)
RETURNS VOID AS $$
DECLARE
    input_tokens INTEGER;
    output_tokens INTEGER;
    total_tokens INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(r.actual_input_tokens), 0),
        COALESCE(SUM(ar.token_count), 0),
        COALESCE(SUM(r.actual_input_tokens), 0) + COALESCE(SUM(ar.token_count), 0)
    INTO input_tokens, output_tokens, total_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
    
    INSERT INTO chat_summaries (
        chat_id,
        total_input_tokens,
        total_output_tokens,
        total_tokens,
        gpt35_input_cost,
        gpt35_output_cost,
        gpt35_total_cost,
        gpt4o_input_cost,
        gpt4o_output_cost,
        gpt4o_total_cost,
        updated_at
    ) VALUES (
        chat_uuid,
        input_tokens,
        output_tokens,
        total_tokens,
        (input_tokens::DECIMAL / 1000000) * 0.50,
        (output_tokens::DECIMAL / 1000000) * 1.50,
        (input_tokens::DECIMAL / 1000000) * 0.50 + (output_tokens::DECIMAL / 1000000) * 1.50,
        (input_tokens::DECIMAL / 1000000) * 5.00,
        (output_tokens::DECIMAL / 1000000) * 15.00,
        (input_tokens::DECIMAL / 1000000) * 5.00 + (output_tokens::DECIMAL / 1000000) * 15.00,
        NOW()
    )
    ON CONFLICT (chat_id) DO UPDATE SET
        total_input_tokens = EXCLUDED.total_input_tokens,
        total_output_tokens = EXCLUDED.total_output_tokens,
        total_tokens = EXCLUDED.total_tokens,
        gpt35_input_cost = EXCLUDED.gpt35_input_cost,
        gpt35_output_cost = EXCLUDED.gpt35_output_cost,
        gpt35_total_cost = EXCLUDED.gpt35_total_cost,
        gpt4o_input_cost = EXCLUDED.gpt4o_input_cost,
        gpt4o_output_cost = EXCLUDED.gpt4o_output_cost,
        gpt4o_total_cost = EXCLUDED.gpt4o_total_cost,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update chat summary when rounds change
CREATE OR REPLACE FUNCTION trigger_update_chat_summary_rounds()
RETURNS TRIGGER AS $$
DECLARE
    chat_uuid UUID;
    chat_exists BOOLEAN;
BEGIN
    chat_uuid := COALESCE(NEW.chat_id, OLD.chat_id);
    -- Check if chat still exists (for DELETE operations)
    SELECT EXISTS(SELECT 1 FROM chats WHERE id = chat_uuid) INTO chat_exists;
    IF chat_exists THEN
        PERFORM update_chat_summary(chat_uuid);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update chat summary when agent responses change
CREATE OR REPLACE FUNCTION trigger_update_chat_summary_responses()
RETURNS TRIGGER AS $$
DECLARE
    chat_uuid UUID;
    round_uuid UUID;
BEGIN
    round_uuid := COALESCE(NEW.round_id, OLD.round_id);
    -- Get chat_id from the rounds table
    SELECT chat_id INTO chat_uuid FROM rounds WHERE id = round_uuid;
    IF chat_uuid IS NOT NULL THEN
        PERFORM update_chat_summary(chat_uuid);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_chat_summary_on_round_change ON rounds;
CREATE TRIGGER update_chat_summary_on_round_change
    AFTER INSERT OR UPDATE OR DELETE ON rounds
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary_rounds();

DROP TRIGGER IF EXISTS update_chat_summary_on_response_change ON agent_responses;
CREATE TRIGGER update_chat_summary_on_response_change
    AFTER INSERT OR UPDATE OR DELETE ON agent_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary_responses();

