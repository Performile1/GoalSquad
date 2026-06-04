-- ============================================================================
-- GOALSQUAD MESSAGE ATTACHMENTS
-- ============================================================================

-- ============================================================================
-- 1. ADD ATTACHMENT COLUMN TO MESSAGES
-- ============================================================================

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT CHECK (attachment_type IN ('image', 'file', 'video')),
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size BIGINT;

-- ============================================================================
-- 2. CREATE MESSAGE ATTACHMENTS STORAGE BUCKET (via Supabase Dashboard)
-- ============================================================================
-- Note: This needs to be created in Supabase Dashboard > Storage
-- Bucket name: message-attachments
-- Public: false (signed URLs for access)

-- ============================================================================
-- 3. CREATE FUNCTION TO GENERATE SIGNED URL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_attachment_url(attachment_url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This would use storage.getSignedUrl in Supabase
  -- For now, return the URL directly (if public bucket)
  RETURN attachment_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
