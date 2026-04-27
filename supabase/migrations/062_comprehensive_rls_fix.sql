-- Comprehensive RLS policy fix for all entity tables
-- This ensures authenticated users can read their own records

-- Drop all existing policies on entity tables to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "merchants_select_own" ON merchants;
DROP POLICY IF EXISTS "communities_select_own" ON communities;
DROP POLICY IF EXISTS "seller_profiles_select_own" ON seller_profiles;
DROP POLICY IF EXISTS "warehouse_partners_select_own" ON warehouse_partners;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "merchants_select" ON merchants;
DROP POLICY IF EXISTS "communities_select" ON communities;
DROP POLICY IF EXISTS "seller_profiles_select" ON seller_profiles;
DROP POLICY IF EXISTS "warehouse_partners_select" ON warehouse_partners;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_partners ENABLE ROW LEVEL SECURITY;

-- Create policies allowing authenticated users to read their own records
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "merchants_select_own" ON merchants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "communities_select_own" ON communities
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "seller_profiles_select_own" ON seller_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "warehouse_partners_select_own" ON warehouse_partners
  FOR SELECT
  USING (auth.uid() = user_id);

-- Verify policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('profiles', 'merchants', 'communities', 'seller_profiles', 'warehouse_partners')
ORDER BY tablename, policyname;
