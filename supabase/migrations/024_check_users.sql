-- ============================================
-- CHECK AND DISPLAY ALL USERS
-- ============================================
-- Run this script to see all users in the database
-- with their roles, entity types, and detailed roles

-- Check auth.users
SELECT '=== AUTH.USERS ====' as info;
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;
-- Check profiles with new fields (conditional)
DO $$
BEGIN
  RAISE NOTICE '=== PROFILES WITH ROLES ====';
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'entity_type') THEN
    RAISE NOTICE 'entity_type column exists';
  ELSE
    RAISE NOTICE 'entity_type column does not exist yet';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'detailed_role') THEN
    RAISE NOTICE 'detailed_role column exists';
  ELSE
    RAISE NOTICE 'detailed_role column does not exist yet';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linked_seller_id') THEN
    RAISE NOTICE 'linked_seller_id column exists';
  ELSE
    RAISE NOTICE 'linked_seller_id column does not exist yet';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linked_community_id') THEN
    RAISE NOTICE 'linked_community_id column exists';
  ELSE
    RAISE NOTICE 'linked_community_id column does not exist yet';
  END IF;
END $$;

-- Basic profiles query
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  is_verified,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Count users by role
SELECT '=== USERS BY ROLE ====' as info;
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- Count users by entity type (conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'entity_type'
  ) THEN
    RAISE NOTICE '=== USERS BY ENTITY TYPE ====';
  END IF;
END $$;

-- Only run if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'entity_type'
  ) THEN
    RAISE NOTICE 'Running entity type query...';
  ELSE
    RAISE NOTICE 'entity_type column does not exist yet - skipping entity type count';
  END IF;
END $$;

-- Count users by detailed role (conditional)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'detailed_role'
  ) THEN
    RAISE NOTICE '=== USERS BY DETAILED ROLE ====';
  END IF;
END $$;

-- Only run if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'detailed_role'
  ) THEN
    RAISE NOTICE 'Running detailed role query...';
  ELSE
    RAISE NOTICE 'detailed_role column does not exist yet - skipping detailed role count';
  END IF;
END $$;

-- Check communities
SELECT '=== COMMUNITIES ====' as info;
SELECT 
  id,
  name,
  community_type,
  status,
  created_at
FROM communities
ORDER BY created_at DESC;

-- Check all profiles/users
SELECT '=== ALL PROFILES/USERS ====' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  is_verified,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Check community members
SELECT '=== COMMUNITY MEMBERS ====' as info;
SELECT 
  cm.id,
  cm.community_id,
  c.name as community_name,
  cm.user_id,
  p.email as user_email,
  p.full_name,
  cm.role,
  cm.status,
  cm.joined_at
FROM community_members cm
JOIN communities c ON c.id = cm.community_id
JOIN profiles p ON p.id = cm.user_id
ORDER BY cm.joined_at DESC;
