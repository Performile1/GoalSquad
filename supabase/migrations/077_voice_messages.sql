-- ============================================================================
-- GOALSQUAD VOICE MESSAGES
-- ============================================================================

-- ============================================================================
-- 1. ADD AUDIO COLUMN TO MESSAGES
-- ============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER; -- Duration in seconds

-- ============================================================================
-- 2. CREATE VOICE MESSAGES STORAGE BUCKET (via Supabase Dashboard)
-- ============================================================================
-- Note: This needs to be created in Supabase Dashboard > Storage
-- Bucket name: voice-messages
-- Public: false (signed URLs for access)

-- ============================================================================
-- 3. UPDATE MESSAGE TYPE CHECK CONSTRAINT
-- ============================================================================

-- Drop and recreate the check constraint to include 'audio'
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'file', 'system', 'audio'));
