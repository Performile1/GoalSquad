-- ============================================================================
-- GOALSQUAD MESSAGING SYSTEM
-- ============================================================================

-- ============================================================================
-- 1. CONVERSATIONS (1-on-1 or Group Chats)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'community', 'broadcast')),
  community_id UUID REFERENCES communities(id),
  name TEXT, -- For group chats
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_community ON conversations(community_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);

-- ============================================================================
-- 2. CONVERSATION PARTICIPANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  muted BOOLEAN DEFAULT FALSE,
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);

-- ============================================================================
-- 3. MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- For attachments, mentions, etc.
  reply_to_id UUID REFERENCES messages(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================================
-- 4. MESSAGE READS (Track who has read what)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON message_reads(message_id);
CREATE INDEX idx_message_reads_user ON message_reads(user_id);

-- ============================================================================
-- 5. BROADCAST MESSAGES (Admin/Merchant to Community)
-- ============================================================================

CREATE TABLE IF NOT EXISTS broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('gs_admin', 'merchant', 'community_admin')),
  sender_id UUID NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('all_users', 'community', 'role')),
  target_id UUID, -- community_id or NULL for all_users
  target_role TEXT, -- For role-based broadcasts
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_broadcast_sender ON broadcast_messages(sender_id);
CREATE INDEX idx_broadcast_target ON broadcast_messages(target_type, target_id);
CREATE INDEX idx_broadcast_sent ON broadcast_messages(sent_at DESC);

-- ============================================================================
-- 6. BROADCAST RECIPIENTS (Track who received/read broadcasts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(broadcast_id, user_id)
);

CREATE INDEX idx_broadcast_recipients_broadcast ON broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON broadcast_recipients(user_id);

-- ============================================================================
-- 7. MERCHANT-TO-COMMUNITY MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS merchant_community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  community_id UUID NOT NULL REFERENCES communities(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'announcement' CHECK (message_type IN ('announcement', 'offer', 'update')),
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_merchant_messages_merchant ON merchant_community_messages(merchant_id);
CREATE INDEX idx_merchant_messages_community ON merchant_community_messages(community_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get or create direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  WHERE c.conversation_type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = p_user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = p_user2_id
  )
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (conversation_type, created_by)
  VALUES ('direct', p_user1_id)
  RETURNING id INTO v_conversation_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, p_user1_id),
    (v_conversation_id, p_user2_id);

  RETURN v_conversation_id;
END;
$$;

-- Get unread message count for user
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM messages m
  JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE cp.user_id = p_user_id
  AND m.sender_id != p_user_id
  AND m.created_at > cp.last_read_at
  AND m.deleted_at IS NULL;

  RETURN v_count;
END;
$$;

-- Mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;

-- Send broadcast to all users in community
CREATE OR REPLACE FUNCTION send_community_broadcast(
  p_sender_id UUID,
  p_community_id UUID,
  p_subject TEXT,
  p_content TEXT,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_broadcast_id UUID;
BEGIN
  -- Create broadcast
  INSERT INTO broadcast_messages (
    sender_type,
    sender_id,
    target_type,
    target_id,
    subject,
    content,
    priority
  ) VALUES (
    'community_admin',
    p_sender_id,
    'community',
    p_community_id,
    p_subject,
    p_content,
    p_priority
  )
  RETURNING id INTO v_broadcast_id;

  -- Add all community members as recipients
  INSERT INTO broadcast_recipients (broadcast_id, user_id)
  SELECT v_broadcast_id, sp.user_id
  FROM seller_profiles sp
  WHERE sp.community_id = p_community_id;

  RETURN v_broadcast_id;
END;
$$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

-- Users can see conversations they're part of
CREATE POLICY conversations_access ON conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can see their own participant records
CREATE POLICY participants_access ON conversation_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can see messages in their conversations
CREATE POLICY messages_access ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
    AND deleted_at IS NULL
  );

-- Users can send messages to their conversations
CREATE POLICY messages_insert ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Users can see broadcasts targeted to them
CREATE POLICY broadcasts_access ON broadcast_messages
  FOR SELECT
  USING (
    id IN (
      SELECT broadcast_id 
      FROM broadcast_recipients 
      WHERE user_id = auth.uid()
    )
    OR sender_id = auth.uid()
  );

-- Users can see their broadcast receipts
CREATE POLICY broadcast_recipients_access ON broadcast_recipients
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS 'Chat conversations (direct, community, broadcast)';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE broadcast_messages IS 'Admin/Merchant broadcasts to communities';
COMMENT ON TABLE merchant_community_messages IS 'Merchant announcements to specific communities';
COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Get existing or create new 1-on-1 conversation';
COMMENT ON FUNCTION send_community_broadcast IS 'Send broadcast message to all community members';
