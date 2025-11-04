-- Fix chat summary to use actual_input_tokens instead of prompt_tokens
-- Migration: 011_fix_chat_summary_calculation.sql

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

