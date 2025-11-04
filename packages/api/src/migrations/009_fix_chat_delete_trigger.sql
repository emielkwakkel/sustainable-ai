-- Fix chat delete trigger to check if chat exists
-- Migration: 009_fix_chat_delete_trigger.sql

-- Update trigger function to check if chat exists before updating summary
CREATE OR REPLACE FUNCTION trigger_update_chat_summary_rounds()
RETURNS TRIGGER AS $$
DECLARE
    chat_uuid UUID;
    chat_exists BOOLEAN;
BEGIN
    chat_uuid := COALESCE(NEW.chat_id, OLD.chat_id);
    -- Check if chat still exists (for DELETE operations where CASCADE has already deleted the chat)
    SELECT EXISTS(SELECT 1 FROM chats WHERE id = chat_uuid) INTO chat_exists;
    IF chat_exists THEN
        PERFORM update_chat_summary(chat_uuid);
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

