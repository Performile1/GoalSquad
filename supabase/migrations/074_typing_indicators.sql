-- ============================================================================
-- GOALSQUAD TYPING INDICATORS
-- ============================================================================

-- ============================================================================
-- 1. CREATE TYPING INDICATORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_typing_conversation ON typing_indicators(conversation_id, updated_at DESC);
CREATE INDEX idx_typing_user ON typing_indicators(user_id, updated_at DESC);

-- ============================================================================
-- 2. ENABLE REALTIME FOR TYPING INDICATORS
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- ============================================================================
-- 3. CREATE FUNCTION TO UPDATE TYPING STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_typing_status(
  p_conversation_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
) RETURNS VOID AS $$
BEGIN
  INSERT INTO typing_indicators (conversation_id, user_id, is_typing, updated_at)
  VALUES (p_conversation_id, p_user_id, p_is_typing, NOW())
  ON CONFLICT (conversation_id, user_id) 
  DO UPDATE 
  SET is_typing = p_is_typing, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE FUNCTION TO CLEANUP OLD TYPING INDICATORS
-- ============================================================================

-- Automatically clear typing indicators older than 10 seconds
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE API ENDPOINT FOR TYPING STATUS
-- ============================================================================

-- This can be called from frontend to update typing status
-- POST /api/messages/[conversationId]/typing
-- Body: { isTyping: boolean }

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Users can view typing indicators in their conversations
DROP POLICY IF EXISTS "Users can view typing indicators in their conversations" ON typing_indicators;
CREATE POLICY "Users can view typing indicators in their conversations"
ON typing_indicators FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own typing status
DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- 7. CLEANUP CRON JOB (Optional)
-- ============================================================================

-- This can be set up as a cron job or called periodically
-- SELECT cleanup_old_typing_indicators();

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Frontend usage:
-- 1. When user starts typing, call update_typing_status(conversationId, userId, true)
-- 2. When user stops typing, call update_typing_status(conversationId, userId, false)
-- 3. Subscribe to INSERT/UPDATE events on typing_indicators table
-- 4. Show "X is typing..." indicator when is_typing = true
-- 5. Hide indicator after 10 seconds of no updates
