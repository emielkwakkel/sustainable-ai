-- Fix chat summary to calculate total tokens as (input + output) × agent_count per round
-- Migration: 012_fix_round_total_calculation.sql

CREATE OR REPLACE FUNCTION update_chat_summary(chat_uuid UUID)
RETURNS VOID AS $$
DECLARE
    input_tokens INTEGER;
    output_tokens INTEGER;
    total_tokens INTEGER;
    agent_count INTEGER;
BEGIN
    -- Get agent count for this chat
    SELECT COUNT(*) INTO agent_count FROM agents WHERE chat_id = chat_uuid;
    IF agent_count = 0 THEN
        agent_count := 1;
    END IF;

    -- Calculate input tokens (sum of prompt_tokens, which is single-agent base)
    -- and output tokens (sum of all agent responses)
    SELECT 
        COALESCE(SUM(r.prompt_tokens), 0),
        COALESCE(SUM(ar.token_count), 0)
    INTO input_tokens, output_tokens
    FROM rounds r
    LEFT JOIN agent_responses ar ON r.id = ar.round_id
    WHERE r.chat_id = chat_uuid;
    
    -- Calculate total tokens: (single_agent_input + total_output) × agent_count for each round, then sum
    -- Where:
    -- - single_agent_input = prompt_tokens (base prompt token count)
    -- - total_output = SUM of all agent response tokens
    -- - Round total = (prompt_tokens + total_output) × agent_count
    -- - Chat total = SUM of all round totals
    
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

