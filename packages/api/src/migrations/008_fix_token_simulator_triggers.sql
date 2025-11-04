-- Fix Token Simulator trigger functions
-- Migration: 008_fix_token_simulator_triggers.sql

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_chat_summary_on_round_change ON rounds;
DROP TRIGGER IF EXISTS update_chat_summary_on_response_change ON agent_responses;

-- Drop old trigger function
DROP FUNCTION IF EXISTS trigger_update_chat_summary();

-- Trigger function to update chat summary when rounds change
CREATE OR REPLACE FUNCTION trigger_update_chat_summary_rounds()
RETURNS TRIGGER AS $$
DECLARE
    chat_uuid UUID;
BEGIN
    chat_uuid := COALESCE(NEW.chat_id, OLD.chat_id);
    PERFORM update_chat_summary(chat_uuid);
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

-- Recreate triggers
CREATE TRIGGER update_chat_summary_on_round_change
    AFTER INSERT OR UPDATE OR DELETE ON rounds
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary_rounds();

CREATE TRIGGER update_chat_summary_on_response_change
    AFTER INSERT OR UPDATE OR DELETE ON agent_responses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_chat_summary_responses();

