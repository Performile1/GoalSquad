-- ============================================
-- SCHEMA COMPARISON REPORT
-- ============================================
-- This script compares the provided schema against expected database state
-- based on migrations applied to the GoalSquad database
--
-- KEY FINDINGS:
-- 1. The provided schema is MISSING columns added in migration 023
-- 2. Profiles table should have additional columns for entity types and roles
-- 3. Communities table should have extended community_type constraint
-- ============================================

-- ============================================
-- MISSING COLUMNS IN PROFILES (from migration 023)
-- ============================================
-- The provided schema shows profiles with these columns:
-- id, email, full_name, avatar_url, phone, date_of_birth, role, guardian_id, 
-- is_active, is_verified, email_verified, phone_verified, language, currency,
-- timezone, email_notifications, sms_notifications, push_notifications, 
-- metadata, created_at, updated_at, status
--
-- BUT migration 023 added these columns that are MISSING from the provided schema:

-- 1. entity_type VARCHAR(50) DEFAULT 'individual'
--    Possible values: 'individual', 'parent', 'seller', 'merchant', 
--                     'warehouse_partner', 'community_admin', 'super_admin'

-- 2. detailed_role VARCHAR(50)
--    Possible values: 
--      - Merchant roles: 'merchant_admin', 'inkop', 'lager', 'faktura', 'support'
--      - Warehouse roles: 'warehouse_admin', 'lagerpersonal', 'fakturaavdelning', 'shipping'
--      - Community roles: 'community_admin', 'community_moderator'
--      - Platform roles: 'platform_admin', 'platform_support'

-- 3. linked_seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL
--    Used for parents linked to seller accounts

-- 4. linked_community_id UUID REFERENCES communities(id) ON DELETE SET NULL
--    Used for parents linked to communities

-- ============================================
-- CONSTRAINTS MISSING FROM PROVIDED SCHEMA
-- ============================================
-- profiles table should have these CHECK constraints:

-- 1. profiles_entity_type_check
--    CHECK (entity_type IN ('individual', 'parent', 'seller', 'merchant', 
--                            'warehouse_partner', 'community_admin', 'super_admin'))

-- 2. profiles_detailed_role_check
--    CHECK (detailed_role IN (
--      'merchant_admin', 'inkop', 'lager', 'faktura', 'support',
--      'warehouse_admin', 'lagerpersonal', 'fakturaavdelning', 'shipping',
--      'community_admin', 'community_moderator',
--      'platform_admin', 'platform_support'
--    ))

-- ============================================
-- COMMUNITIES TABLE CONSTRAINT DIFFERENCES
-- ============================================
-- Provided schema shows:
-- CHECK (community_type IN ('club', 'class', 'association', 'school'))

-- But migration 023 extended this to:
-- CHECK (community_type IN ('club', 'klass', 'forening', 'association', 'school', 'organization'))

-- Note: 'klass' (Swedish) instead of 'class', and added 'forening' and 'organization'

-- ============================================
-- INDEXES MISSING FROM PROVIDED SCHEMA
-- ============================================
-- These indexes should exist from migration 023:

-- 1. idx_profiles_entity_type ON profiles(entity_type)
-- 2. idx_profiles_detailed_role ON profiles(detailed_role)
-- 3. idx_profiles_linked_seller ON profiles(linked_seller_id)
-- 4. idx_profiles_linked_community ON profiles(linked_community_id)

-- ============================================
-- RLS POLICIES UPDATED IN MIGRATION 023
-- ============================================
-- The following policies were updated/dropped and recreated:

-- 1. "Users can view own profile" - Recreated
-- 2. "Users can update own profile" - Recreated
-- 3. "Service role full access" - Recreated
-- 4. NEW: "Parents can view linked seller's profile"

-- ============================================
-- FUNCTIONS ADDED IN MIGRATION 023
-- ============================================
-- These helper functions should exist:

-- 1. has_role(p_user_id UUID, p_role VARCHAR) RETURNS BOOLEAN
-- 2. has_detailed_role(p_user_id UUID, p_detailed_role VARCHAR) RETURNS BOOLEAN
-- 3. is_parent_of(p_parent_id UUID, p_seller_id UUID) RETURNS BOOLEAN
-- 4. get_user_communities(p_user_id UUID) RETURNS TABLE (community_id UUID, role VARCHAR)

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if new columns exist in profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('entity_type', 'detailed_role', 'linked_seller_id', 'linked_community_id')
ORDER BY column_name;

-- Check if constraints exist
SELECT 
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'profiles'
  AND con.conname LIKE '%entity_type%'
  OR con.conname LIKE '%detailed_role%'
ORDER BY con.conname;

-- Check if indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE '%entity_type%'
  OR indexname LIKE '%detailed_role%'
  OR indexname LIKE '%linked_seller%'
  OR indexname LIKE '%linked_community%'
ORDER BY indexname;

-- Check if functions exist
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname IN ('has_role', 'has_detailed_role', 'is_parent_of', 'get_user_communities')
ORDER BY proname;

-- ============================================
-- CONCLUSION SUMMARY
-- ============================================
DO $$
DECLARE
  v_entity_type_exists BOOLEAN;
  v_detailed_role_exists BOOLEAN;
  v_linked_seller_exists BOOLEAN;
  v_linked_community_exists BOOLEAN;
  v_entity_type_constraint_exists BOOLEAN;
  v_detailed_role_constraint_exists BOOLEAN;
  v_has_role_func_exists BOOLEAN;
  v_has_detailed_role_func_exists BOOLEAN;
  v_is_parent_of_func_exists BOOLEAN;
  v_get_user_communities_func_exists BOOLEAN;
  v_missing_count INTEGER := 0;
BEGIN
  -- Check columns
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'entity_type'
  ) INTO v_entity_type_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'detailed_role'
  ) INTO v_detailed_role_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linked_seller_id'
  ) INTO v_linked_seller_exists;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'linked_community_id'
  ) INTO v_linked_community_exists;

  -- Check constraints
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'profiles' AND con.conname = 'profiles_entity_type_check'
  ) INTO v_entity_type_constraint_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'profiles' AND con.conname = 'profiles_detailed_role_check'
  ) INTO v_detailed_role_constraint_exists;

  -- Check functions
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'has_role'
  ) INTO v_has_role_func_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'has_detailed_role'
  ) INTO v_has_detailed_role_func_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_parent_of'
  ) INTO v_is_parent_of_func_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_communities'
  ) INTO v_get_user_communities_func_exists;

  -- Count missing
  IF NOT v_entity_type_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_detailed_role_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_linked_seller_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_linked_community_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_entity_type_constraint_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_detailed_role_constraint_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_has_role_func_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_has_detailed_role_func_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_is_parent_of_func_exists THEN v_missing_count := v_missing_count + 1; END IF;
  IF NOT v_get_user_communities_func_exists THEN v_missing_count := v_missing_count + 1; END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SCHEMA COMPARISON CONCLUSION';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'COLUMN STATUS:';
  RAISE NOTICE '  entity_type: %', CASE WHEN v_entity_type_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  detailed_role: %', CASE WHEN v_detailed_role_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  linked_seller_id: %', CASE WHEN v_linked_seller_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  linked_community_id: %', CASE WHEN v_linked_community_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'CONSTRAINT STATUS:';
  RAISE NOTICE '  profiles_entity_type_check: %', CASE WHEN v_entity_type_constraint_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  profiles_detailed_role_check: %', CASE WHEN v_detailed_role_constraint_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE 'FUNCTION STATUS:';
  RAISE NOTICE '  has_role(): %', CASE WHEN v_has_role_func_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  has_detailed_role(): %', CASE WHEN v_has_detailed_role_func_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  is_parent_of(): %', CASE WHEN v_is_parent_of_func_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '  get_user_communities(): %', CASE WHEN v_get_user_communities_func_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TOTAL MISSING: % / 10', v_missing_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  IF v_missing_count = 0 THEN
    RAISE NOTICE '✓ Database is UP TO DATE with migration 023';
  ELSE
    RAISE NOTICE '✗ Database is MISSING % items from migration 023', v_missing_count;
    RAISE NOTICE '  Run migration 023 to add missing items';
  END IF;

  RAISE NOTICE '';
END $$;
