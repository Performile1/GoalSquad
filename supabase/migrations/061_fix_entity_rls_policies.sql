-- Fix RLS policies to allow users to read their own entity records
-- This fixes 403 errors when fetching entity data in auth-context

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_partners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "merchants_select_own" ON merchants;
DROP POLICY IF EXISTS "communities_select_own" ON communities;
DROP POLICY IF EXISTS "seller_profiles_select_own" ON seller_profiles;
DROP POLICY IF EXISTS "warehouse_partners_select_own" ON warehouse_partners;

-- Create policies to allow users to read their own records
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
