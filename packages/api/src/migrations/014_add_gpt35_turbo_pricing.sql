-- Add GPT-3.5 Turbo pricing to chat_summaries table and update calculation
-- Migration: 014_add_gpt35_turbo_pricing.sql

-- Add GPT-3.5 Turbo cost columns
ALTER TABLE chat_summaries 
ADD COLUMN IF NOT EXISTS gpt35_input_cost DECIMAL(20, 10),
ADD COLUMN IF NOT EXISTS gpt35_output_cost DECIMAL(20, 10),
ADD COLUMN IF NOT EXISTS gpt35_total_cost DECIMAL(20, 10);

-- Update the function to calculate costs including GPT-3.5 Turbo
CREATE OR REPLACE FUNCTION update_chat_summary(chat_uuid UUID)
RETURNS VOID AS $$
DECLARE
    input_tokens INTEGER;
    output_tokens INTEGER;
    total_tokens INTEGER;
    agent_count INTEGER;
    actual_input_tokens INTEGER;
BEGIN
    -- Get agent count for this chat
    SELECT COUNT(*) INTO agent_count FROM agents WHERE chat_id = chat_uuid;
    IF agent_count = 0 THEN
        agent_count := 1;
    END IF;

    -- Calculate output tokens (sum of all agent responses)
    SELECT 
        COALESCE(SUM(ar.token_count), 0)
    INTO output_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
    
    -- Calculate cumulative total tokens: (single_agent_input + total_output) × agent_count for each round, then sum
    -- This cumulative total should be stored as total_input_tokens in the summary
    SELECT 
        COALESCE(SUM(
            (COALESCE(r.prompt_tokens, 0) + COALESCE(round_output.total_output, 0)) * agent_count
        ), 0)::INTEGER
    INTO total_tokens
    FROM rounds r
    LEFT JOIN (
        SELECT round_id, SUM(token_count) as total_output
        FROM agent_responses
        GROUP BY round_id
    ) round_output ON r.id = round_output.round_id
    WHERE r.chat_id = chat_uuid;
    
    -- Calculate cumulative input tokens (sum of actual_input_tokens from all rounds)
    -- This represents the total input tokens sent across all rounds
    SELECT COALESCE(SUM(r.actual_input_tokens), 0)
    INTO actual_input_tokens
    FROM rounds r
    WHERE r.chat_id = chat_uuid;
    
    -- Store cumulative total as total_input_tokens for display (matches UI cumulative)
    -- This is the cumulative total: (input + output) × agents per round, summed
    input_tokens := total_tokens;
    
    -- For cost calculation, use the actual input tokens (sum of actual_input_tokens)
    -- This matches the "Input Tokens" value that should be displayed (1005 in the example)
    -- The cost should be calculated on the cumulative input tokens, not the cumulative total
    
    -- Calculate costs using pricing (per 1M tokens):
    -- GPT-3.5 Turbo: Input $0.50, Output $1.50
    -- GPT-4o: Input $2.50, Output $10.00
    -- GPT-4.1: Input $2.00, Output $8.00
    -- GPT-5: Input $1.25, Output $10.00
    
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
        gpt41_input_cost,
        gpt41_output_cost,
        gpt41_total_cost,
        gpt5_input_cost,
        gpt5_output_cost,
        gpt5_total_cost,
        updated_at
    ) VALUES (
        chat_uuid,
        actual_input_tokens,  -- Use actual input tokens for display (matches expected 1005)
        output_tokens,
        total_tokens,
        -- GPT-3.5 Turbo: $0.50 per 1M input tokens, $1.50 per 1M output tokens
        (actual_input_tokens::DECIMAL / 1000000) * 0.50,
        (output_tokens::DECIMAL / 1000000) * 1.50,
        (actual_input_tokens::DECIMAL / 1000000) * 0.50 + (output_tokens::DECIMAL / 1000000) * 1.50,
        -- GPT-4o: $2.50 per 1M input tokens, $10.00 per 1M output tokens
        (actual_input_tokens::DECIMAL / 1000000) * 2.50,
        (output_tokens::DECIMAL / 1000000) * 10.00,
        (actual_input_tokens::DECIMAL / 1000000) * 2.50 + (output_tokens::DECIMAL / 1000000) * 10.00,
        -- GPT-4.1: $2.00 per 1M input tokens, $8.00 per 1M output tokens
        (actual_input_tokens::DECIMAL / 1000000) * 2.00,
        (output_tokens::DECIMAL / 1000000) * 8.00,
        (actual_input_tokens::DECIMAL / 1000000) * 2.00 + (output_tokens::DECIMAL / 1000000) * 8.00,
        -- GPT-5: $1.25 per 1M input tokens, $10.00 per 1M output tokens
        (actual_input_tokens::DECIMAL / 1000000) * 1.25,
        (output_tokens::DECIMAL / 1000000) * 10.00,
        (actual_input_tokens::DECIMAL / 1000000) * 1.25 + (output_tokens::DECIMAL / 1000000) * 10.00,
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
        gpt41_input_cost = EXCLUDED.gpt41_input_cost,
        gpt41_output_cost = EXCLUDED.gpt41_output_cost,
        gpt41_total_cost = EXCLUDED.gpt41_total_cost,
        gpt5_input_cost = EXCLUDED.gpt5_input_cost,
        gpt5_output_cost = EXCLUDED.gpt5_output_cost,
        gpt5_total_cost = EXCLUDED.gpt5_total_cost,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

