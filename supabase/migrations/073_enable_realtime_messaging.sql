-- ============================================================================
-- GOALSQUAD REALTIME MESSAGING SETUP
-- ============================================================================
-- This migration enables Supabase Realtime for the messaging system
-- allowing live updates without polling

-- ============================================================================
-- 1. ENABLE REALTIME FOR MESSAGING TABLES
-- ============================================================================

-- Add tables to supabase_realtime publication
-- This enables PostgreSQL logical replication to push changes to Supabase Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;

-- ============================================================================
-- 2. CREATE REALTIME FUNCTIONS FOR TYPING INDICATORS
-- ============================================================================

-- Function to set typing status
CREATE OR REPLACE FUNCTION set_typing_status(
  p_conversation_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID AS $$
BEGIN
  -- This could be stored in a separate typing_indicators table
  -- For now, we'll use the existing message_reads table with a flag
  INSERT INTO message_reads (message_id, user_id, read_at)
  VALUES (
    gen_random_uuid(), -- Placeholder message_id
    p_user_id,
    CASE WHEN p_is_typing THEN NOW() ELSE NULL END
  )
  ON CONFLICT (message_id, user_id) DO UPDATE
  SET read_at = CASE WHEN p_is_typing THEN NOW() ELSE NULL END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE REALTIME VIEWS FOR ONLINE STATUS
-- ============================================================================

-- View to track user presence in conversations
CREATE OR REPLACE VIEW conversation_presence AS
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.last_read_at as last_seen,
  CASE 
    WHEN cp.last_read_at > NOW() - INTERVAL '5 minutes' THEN 'online'
    WHEN cp.last_read_at > NOW() - INTERVAL '1 hour' THEN 'away'
    ELSE 'offline'
  END as presence_status
FROM conversation_participants cp
ORDER BY cp.last_read_at DESC;

-- ============================================================================
-- 4. PERFORMANCE INDEXES FOR REALTIME QUERIES
-- ============================================================================

-- Index for efficient real-time message filtering
CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON messages(conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Index for typing indicator lookups
CREATE INDEX IF NOT EXISTS idx_conv_participants_last_read 
ON conversation_participants(user_id, last_read_at DESC);

-- ============================================================================
-- 5. ROW LEVEL SECURITY FOR REALTIME
-- ============================================================================

-- Ensure RLS policies allow realtime subscriptions
-- Users can only subscribe to conversations they participate in

-- Messages: Users can see messages from conversations they're in
DROP POLICY IF EXISTS "Users can view messages in their conversations realtime" ON messages;
CREATE POLICY "Users can view messages in their conversations realtime"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Conversation participants: Users can see who's in their conversations
DROP POLICY IF EXISTS "Users can view participants in their conversations realtime" ON conversation_participants;
CREATE POLICY "Users can view participants in their conversations realtime"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. VERIFICATION QUERY
-- ============================================================================

-- Verify that tables are in the publication
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('messages', 'conversations', 'conversation_participants', 'message_reads');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- After running this migration:
-- 1. Go to Supabase Dashboard > Database > Replication
-- 2. Verify that the tables are listed under "supabase_realtime" publication
-- 3. Ensure "Realtime" is enabled for your project
-- 
-- Frontend usage:
-- - Use @supabase/supabase-js client with realtime channels
-- - Subscribe to INSERT events on messages table
-- - Filter by conversation_id for specific chats
-- 
-- Example subscription:
-- const channel = supabase
--   .channel('messages:' + conversationId)
--   .on('postgres_changes', {
--     event: 'INSERT',
--     schema: 'public',
--     table: 'messages',
--     filter: `conversation_id=eq.${conversationId}`
--   }, (payload) => {
--     console.log('New message:', payload.new)
--   })
--   .subscribe()
