-- ============================================
-- EXTENDED ROLES AND ENTITY TYPES
-- ============================================
-- This migration adds support for:
-- - Entity types: individual, parent, seller, merchant, warehouse_partner, community_admin
-- - Detailed roles for merchants: admin, inköp, lager, faktura
-- - Detailed roles for warehouse partners: admin, lagerpersonal, fakturaavdelning
-- - Parent relationships linked to seller and community/association/class
-- - Community types: förening, klass, klubb

DO $$
BEGIN
  RAISE NOTICE 'Adding entity type and detailed role fields to profiles...';
  
  -- Add entity_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'entity_type') THEN
    ALTER TABLE profiles ADD COLUMN entity_type VARCHAR(50) DEFAULT 'individual';
    RAISE NOTICE 'Added entity_type column';
  END IF;
  
  -- Add detailed_role column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'detailed_role') THEN
    ALTER TABLE profiles ADD COLUMN detailed_role VARCHAR(50);
    RAISE NOTICE 'Added detailed_role column';
  END IF;
  
  -- Add linked_seller_id column (for parents)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linked_seller_id') THEN
    ALTER TABLE profiles ADD COLUMN linked_seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added linked_seller_id column';
  END IF;
  
  -- Add linked_community_id column (for parents)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linked_community_id') THEN
    ALTER TABLE profiles ADD COLUMN linked_community_id UUID REFERENCES communities(id) ON DELETE SET NULL;
    RAISE NOTICE 'Add linked_community_id column';
  END IF;
  
  -- Add guardian_id column (already exists in validation, but let's check)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'guardian_id') THEN
    ALTER TABLE profiles ADD COLUMN guardian_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added guardian_id column';
  END IF;
  
  RAISE NOTICE 'Profile columns added successfully';
END $$;

-- Add constraints for entity_type
DO $$
BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_entity_type_check 
    CHECK (entity_type IN ('individual', 'parent', 'seller', 'merchant', 'warehouse_partner', 'community_admin', 'super_admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add constraints for detailed_role
DO $$
BEGIN
  ALTER TABLE profiles ADD CONSTRAINT profiles_detailed_role_check 
    CHECK (detailed_role IN (
      -- Merchant roles
      'merchant_admin', 'inkop', 'lager', 'faktura', 'support',
      -- Warehouse partner roles
      'warehouse_admin', 'lagerpersonal', 'fakturaavdelning', 'shipping',
      -- Community roles
      'community_admin', 'community_moderator',
      -- Platform roles
      'platform_admin', 'platform_support'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update communities to support more types
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE communities DROP CONSTRAINT IF EXISTS communities_community_type_check;
  
  -- Add new constraint with more types
  ALTER TABLE communities ADD CONSTRAINT communities_community_type_check 
    CHECK (community_type IN ('club', 'klass', 'forening', 'association', 'school', 'organization'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_entity_type ON profiles(entity_type);
CREATE INDEX IF NOT EXISTS idx_profiles_detailed_role ON profiles(detailed_role);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_seller ON profiles(linked_seller_id);
CREATE INDEX IF NOT EXISTS idx_profiles_linked_community ON profiles(linked_community_id);

-- Update RLS policies for profiles to handle new roles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Parents can view linked seller's profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE linked_seller_id = profiles.id
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(p_user_id UUID, p_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has specific detailed role
CREATE OR REPLACE FUNCTION has_detailed_role(p_user_id UUID, p_detailed_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id 
    AND detailed_role = p_detailed_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is parent of seller
CREATE OR REPLACE FUNCTION is_parent_of(p_parent_id UUID, p_seller_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_parent_id 
    AND linked_seller_id = p_seller_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's community access
CREATE OR REPLACE FUNCTION get_user_communities(p_user_id UUID)
RETURNS TABLE (community_id UUID, role VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.community_id,
    cm.role
  FROM community_members cm
  WHERE cm.user_id = p_user_id
  UNION
  SELECT 
    p.linked_community_id,
    'parent'::VARCHAR
  FROM profiles p
  WHERE p.id = p_user_id
  AND p.linked_community_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  RAISE NOTICE 'Extended roles and entity types migration completed';
END $$;
