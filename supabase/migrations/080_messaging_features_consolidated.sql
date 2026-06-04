-- ============================================================================
-- GOALSQUAD MESSAGING FEATURES - CONSOLIDATED MIGRATION
-- ============================================================================
-- This migration consolidates all messaging-related changes:
-- - Realtime messaging (073)
-- - Typing indicators (074)
-- - Push notifications (075)
-- - Message attachments (076)
-- - Voice messages (077)
--
-- Run this migration in Supabase SQL Editor to enable all messaging features
-- ============================================================================

-- ============================================================================
-- 1. ENABLE REALTIME FOR MESSAGING TABLES
-- ============================================================================

-- Note: PostgreSQL doesn't support IF NOT EXISTS in ALTER PUBLICATION
-- We'll use a DO block to check if table is already in publication

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'message_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reads;
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE TYPING INDICATORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_typing_user ON typing_indicators(user_id, updated_at DESC);

-- Enable realtime for typing indicators
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
  END IF;
END $$;

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

CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS VOID AS $$
BEGIN
  DELETE FROM typing_indicators 
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. CREATE PUSH SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- ============================================================================
-- 6. CREATE NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('order', 'campaign', 'message', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ============================================================================
-- 7. ADD ATTACHMENT COLUMNS TO MESSAGES
-- ============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'file', 'video')),
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

-- ============================================================================
-- 8. ADD AUDIO COLUMNS TO MESSAGES
-- ============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER;

-- ============================================================================
-- 9. UPDATE MESSAGE TYPE CHECK CONSTRAINT
-- ============================================================================

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'file', 'system', 'audio'));

-- ============================================================================
-- 10. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_realtime 
ON messages(conversation_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_conv_participants_last_read 
ON conversation_participants(user_id, last_read_at DESC);

-- ============================================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================================

-- Typing Indicators
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own typing status" ON typing_indicators;
CREATE POLICY "Users can update their own typing status"
ON typing_indicators FOR UPDATE
USING (user_id = auth.uid());

-- Push Subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
ON push_subscriptions FOR ALL
USING (user_id = auth.uid());

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can mark their own notifications as read"
ON notifications FOR UPDATE
USING (user_id = auth.uid());

-- Messages Realtime
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

-- Conversation Participants Realtime
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
-- 12. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables in realtime publication
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('messages', 'conversations', 'conversation_participants', 'message_reads', 'typing_indicators');

-- Verify new tables exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('typing_indicators', 'push_subscriptions', 'notifications')
ORDER BY table_name, ordinal_position;

-- Verify message columns exist
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'messages'
  AND column_name IN ('attachment_url', 'attachment_type', 'attachment_name', 'attachment_size', 'audio_url', 'audio_duration')
ORDER BY ordinal_position;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- AFTER RUNNING THIS MIGRATION:
-- 
-- 1. Create Storage Buckets in Supabase Dashboard:
--    - Bucket: message-attachments (for images and files)
--    - Bucket: voice-messages (for audio recordings)
--    - Set both buckets to private (use signed URLs)
-- 
-- 2. Verify Realtime is enabled:
--    - Go to Supabase Dashboard > Database > Replication
--    - Verify tables are listed under "supabase_realtime" publication
-- 
-- 3. Environment Variables:
--    - Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set
--    - Add NEXT_PUBLIC_VAPID_PUBLIC_KEY for push notifications (optional)
-- 
-- 4. Frontend Components Created:
--    - AttachmentPreview.tsx - Display attachments in chat
--    - AudioPlayer.tsx - Play voice messages
--    - NotificationPermissionRequest.tsx - Request notification permission
--    - NotificationSettings.tsx - Manage notification preferences
--    - NotificationDisplay.tsx - Show notification bell and dropdown
-- 
-- 5. API Endpoints Created:
--    - POST /api/notifications/subscribe - Subscribe to push notifications
--    - POST /api/messages/upload-attachment - Upload file attachments
--    - POST /api/messages/upload-audio - Upload voice messages
--    - POST /api/messages/[conversationId]/typing - Update typing status
