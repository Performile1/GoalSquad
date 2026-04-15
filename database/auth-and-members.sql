/**
 * Authentication & Member Management
 * 
 * Complete system for:
 * - User registration
 * - Community membership
 * - Invitations
 * - Role-based access control
 */

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(50),
  date_of_birth DATE,
  
  -- Role
  role VARCHAR(50) DEFAULT 'user', -- 'user', 'seller', 'admin', 'merchant'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  
  -- Preferences
  language VARCHAR(10) DEFAULT 'sv',
  currency VARCHAR(3) DEFAULT 'SEK',
  timezone VARCHAR(50) DEFAULT 'Europe/Stockholm',
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active) WHERE is_active = true;

-- ============================================
-- 2. COMMUNITY MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role in community
  role VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'seller', 'member'
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending', 'banned'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Seller info (if role = 'seller')
  seller_profile_id UUID REFERENCES seller_profiles(user_id),
  
  -- Permissions
  can_invite BOOLEAN DEFAULT false,
  can_post BOOLEAN DEFAULT true,
  can_sell BOOLEAN DEFAULT false,
  
  -- Metadata
  invited_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(community_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_members_community ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON community_members(community_id, role);
CREATE INDEX IF NOT EXISTS idx_community_members_status ON community_members(status) WHERE status = 'active';

-- ============================================
-- 3. INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who & Where
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invitee
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Invitation details
  role VARCHAR(50) DEFAULT 'member',
  message TEXT,
  token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES profiles(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invitations_community ON invitations(community_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status) WHERE status = 'pending';

-- ============================================
-- 4. SELLER PROFILES
-- ============================================

-- Extend existing seller_profiles if needed
ALTER TABLE seller_profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bank_account_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to check if user can invite
CREATE OR REPLACE FUNCTION can_user_invite(
  p_user_id UUID,
  p_community_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_members
    WHERE user_id = p_user_id
      AND community_id = p_community_id
      AND status = 'active'
      AND (role IN ('admin', 'moderator') OR can_invite = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept invitation
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token VARCHAR(255),
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_invitation invitations;
  v_member_id UUID;
BEGIN
  -- Get invitation
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if already member
  IF EXISTS (
    SELECT 1 FROM community_members
    WHERE community_id = v_invitation.community_id
      AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member');
  END IF;

  -- Add as member
  INSERT INTO community_members (
    community_id,
    user_id,
    role,
    status,
    invited_by
  ) VALUES (
    v_invitation.community_id,
    p_user_id,
    v_invitation.role,
    'active',
    v_invitation.invited_by
  ) RETURNING id INTO v_member_id;

  -- Update invitation
  UPDATE invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = p_user_id,
      updated_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'memberId', v_member_id,
    'communityId', v_invitation.community_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's communities
CREATE OR REPLACE FUNCTION get_user_communities(p_user_id UUID)
RETURNS TABLE (
  community_id UUID,
  community_name TEXT,
  community_type VARCHAR(50),
  member_role VARCHAR(50),
  member_status VARCHAR(50),
  joined_at TIMESTAMP WITH TIME ZONE,
  can_invite BOOLEAN,
  can_sell BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.community_type,
    cm.role,
    cm.status,
    cm.joined_at,
    cm.can_invite,
    cm.can_sell
  FROM community_members cm
  JOIN communities c ON c.id = cm.community_id
  WHERE cm.user_id = p_user_id
    AND cm.status = 'active'
  ORDER BY cm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Community Members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view community members"
  ON community_members FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE user_id = auth.uid()
        AND community_id = community_members.community_id
        AND role IN ('admin', 'moderator')
    )
  );

-- Invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations sent to them"
  ON invitations FOR SELECT
  USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

CREATE POLICY "Authorized users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    can_user_invite(auth.uid(), community_id)
  );

-- ============================================
-- 7. VIEWS
-- ============================================

-- Active members by community
CREATE OR REPLACE VIEW community_members_active AS
SELECT 
  cm.*,
  p.full_name,
  p.email,
  p.avatar_url,
  c.name as community_name
FROM community_members cm
JOIN profiles p ON p.id = cm.user_id
JOIN communities c ON c.id = cm.community_id
WHERE cm.status = 'active';

-- Pending invitations
CREATE OR REPLACE VIEW invitations_pending AS
SELECT 
  i.*,
  c.name as community_name,
  p.full_name as invited_by_name
FROM invitations i
JOIN communities c ON c.id = i.community_id
JOIN profiles p ON p.id = i.invited_by
WHERE i.status = 'pending'
  AND i.expires_at > NOW();

-- Grant permissions
GRANT SELECT ON community_members_active TO authenticated, anon;
GRANT SELECT ON invitations_pending TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_invite TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_communities TO authenticated;

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE community_members IS 'Members of communities with roles and permissions';
COMMENT ON TABLE invitations IS 'Invitations to join communities';
COMMENT ON FUNCTION accept_invitation IS 'Accept an invitation and join community';
