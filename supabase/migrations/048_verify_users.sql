-- Verify all test users exist with correct credentials and roles

-- Check all users and their current status
SELECT 
  'All Users' as check_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count
FROM profiles;

-- Check specific test users
SELECT 
  'Test Users' as check_type,
  id,
  email,
  role,
  is_active,
  is_verified,
  created_at
FROM profiles
WHERE id IN (
    '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b', -- Club user
    'd8135a02-9540-46d6-b917-feb923d801e5', -- Consumer user
    '378b4494-5442-417a-ae29-9cf6a036fbad', -- Merchant user
    'd75dfaf6-592f-41dd-ac9b-c942812ac304', -- Seller user
    '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92'  -- Warehouse user
)
ORDER BY role;

-- Check role distribution
SELECT 
  'Role Distribution' as check_type,
  role,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
  COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count
FROM profiles
GROUP BY role
ORDER BY role;

-- Check if any users are missing required role assignments
SELECT 
  'Missing Roles' as check_type,
  COUNT(*) as count
FROM profiles
WHERE role IS NULL OR role = '';

-- Check for users without email
SELECT 
  'Users Without Email' as check_type,
  COUNT(*) as count
FROM profiles
WHERE email IS NULL OR email = '';

-- Check merchant-specific tables
SELECT 
  'Merchants' as check_type,
  COUNT(*) as count
FROM merchants;

SELECT 
  'Merchants with profiles' as check_type,
  COUNT(*) as count
FROM merchants m
JOIN profiles p ON m.user_id = p.id;

-- Check seller-specific tables
SELECT 
  'Sellers' as check_type,
  COUNT(*) as count
FROM sellers;

SELECT 
  'Sellers with profiles' as check_type,
  COUNT(*) as count
FROM sellers s
JOIN profiles p ON s.user_id = p.id;

-- Check warehouse-specific tables
SELECT 
  'Warehouse Partners' as check_type,
  COUNT(*) as count
FROM warehouse_partners;

SELECT 
  'Warehouse Partners with profiles' as check_type,
  COUNT(*) as count
FROM warehouse_partners wp
JOIN profiles p ON wp.user_id = p.id;

-- Check communities
SELECT 
  'Communities' as check_type,
  COUNT(*) as count
FROM communities;

SELECT 
  'Community Members' as check_type,
  COUNT(*) as count
FROM community_members;
