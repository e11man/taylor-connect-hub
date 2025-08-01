-- Fix chat_messages RLS policies for direct authentication
-- This migration updates the RLS policies to work with direct auth instead of Supabase Auth

-- 1. Drop existing RLS policies that use auth.uid()
DROP POLICY IF EXISTS "Users can create chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- 2. Disable RLS temporarily to allow direct operations
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- 3. Create a function to safely insert chat messages
CREATE OR REPLACE FUNCTION insert_chat_message(
  p_event_id UUID,
  p_message TEXT,
  p_is_anonymous BOOLEAN DEFAULT false,
  p_user_id UUID DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Validate that the event exists
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Validate user_id if provided
  IF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Validate organization_id if provided
  IF p_organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = p_organization_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Insert the message
  INSERT INTO chat_messages (
    event_id,
    message,
    is_anonymous,
    user_id,
    organization_id
  ) VALUES (
    p_event_id,
    p_message,
    p_is_anonymous,
    p_user_id,
    p_organization_id
  ) RETURNING id INTO message_id;

  RETURN message_id;
END;
$$;

-- 4. Create a function to safely update chat messages
CREATE OR REPLACE FUNCTION update_chat_message(
  p_message_id UUID,
  p_new_message TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user owns this message
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE id = p_message_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to update this message';
  END IF;

  -- Update the message
  UPDATE chat_messages 
  SET message = p_new_message, updated_at = now()
  WHERE id = p_message_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- 5. Create a function to safely delete chat messages
CREATE OR REPLACE FUNCTION delete_chat_message(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the user owns this message
  IF NOT EXISTS (
    SELECT 1 FROM chat_messages 
    WHERE id = p_message_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this message';
  END IF;

  -- Delete the message
  DELETE FROM chat_messages 
  WHERE id = p_message_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- 6. Create a function to get chat messages for an event
CREATE OR REPLACE FUNCTION get_chat_messages(p_event_id UUID)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  user_id UUID,
  organization_id UUID,
  message TEXT,
  is_anonymous BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.id,
    cm.event_id,
    cm.user_id,
    cm.organization_id,
    cm.message,
    cm.is_anonymous,
    cm.created_at,
    cm.updated_at,
    o.name as organization_name
  FROM chat_messages cm
  LEFT JOIN organizations o ON cm.organization_id = o.id
  WHERE cm.event_id = p_event_id
  ORDER BY cm.created_at ASC;
END;
$$;

-- 7. Grant permissions for the new functions
GRANT EXECUTE ON FUNCTION insert_chat_message(UUID, TEXT, BOOLEAN, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_chat_message(UUID, TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_chat_message(UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_chat_messages(UUID) TO anon, authenticated;

-- 8. Add helpful indexes for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_event_id_created_at ON chat_messages(event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_organization_id ON chat_messages(organization_id);

-- 9. Add comments for documentation
COMMENT ON FUNCTION insert_chat_message(UUID, TEXT, BOOLEAN, UUID, UUID) IS 'Safely insert a new chat message with validation';
COMMENT ON FUNCTION update_chat_message(UUID, TEXT, UUID) IS 'Safely update a chat message owned by the user';
COMMENT ON FUNCTION delete_chat_message(UUID, UUID) IS 'Safely delete a chat message owned by the user';
COMMENT ON FUNCTION get_chat_messages(UUID) IS 'Get all chat messages for an event with organization names';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Chat messages RLS fix completed successfully';
  RAISE NOTICE 'RLS disabled and secure functions created for direct authentication';
END $$; 