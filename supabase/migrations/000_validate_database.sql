/**
 * ============================================
 * GOALSQUAD - DATABASE VALIDATION SCRIPT
 * ============================================
 * 
 * Run this script in Supabase SQL Editor BEFORE running migrations.
 * This will show you what currently exists in the database.
 * 
 * WHAT THIS SCRIPT CHECKS:
 * 1. All existing tables
 * 2. Columns in each table
 * 3. Indexes on each table
 * 4. RLS policies on each table
 * 5. Foreign key constraints
 * ============================================
 */

-- ============================================
-- 1. LIST ALL TABLES
-- ============================================
SELECT '=== ALL TABLES IN DATABASE ====' as info;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 2. LIST COLUMNS FOR EACH TABLE
-- ============================================
SELECT '=== COLUMNS IN EACH TABLE ====' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================
-- 3. LIST INDEXES
-- ============================================
SELECT '=== INDEXES ====' as info;
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 4. LIST RLS POLICIES
-- ============================================
SELECT '=== RLS POLICIES ====' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 5. LIST FOREIGN KEY CONSTRAINTS
-- ============================================
SELECT '=== FOREIGN KEY CONSTRAINTS ====' as info;
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================
-- 6. CHECK IF SPECIFIC TABLES EXIST
-- ============================================
SELECT '=== TABLE EXISTENCE CHECK ====' as info;
SELECT 
  'organizations' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') as exists
UNION ALL
SELECT 
  'profiles' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public')
UNION ALL
SELECT 
  'communities' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'communities' AND table_schema = 'public')
UNION ALL
SELECT 
  'community_members' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'community_members' AND table_schema = 'public')
UNION ALL
SELECT 
  'merchants' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'merchants' AND table_schema = 'public')
UNION ALL
SELECT 
  'products' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public')
UNION ALL
SELECT 
  'community_products' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'community_products' AND table_schema = 'public')
UNION ALL
SELECT 
  'blog_posts' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts' AND table_schema = 'public')
ORDER BY table_name;
