-- Fix admin role and verify all users

-- Update admin user role to gs_admin
UPDATE profiles
SET role = 'gs_admin',
    is_active = true,
    is_verified = true
WHERE email = 'admin@goalsquad.se';

-- Check all users and their current status
SELECT 
  'All Users Status' as check_type,
  id,
  email,
  role,
  is_active,
  is_verified,
  created_at
FROM profiles
ORDER BY role, email;

-- Check if test users exist
SELECT 
  'Test Users Check' as check_type,
  id,
  email,
  role,
  is_active,
  is_verified
FROM profiles
WHERE id IN (
    '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b', -- Club user
    'd8135a02-9540-46d6-b917-feb923d801e5', -- Consumer user
    '378b4494-5442-417a-ae29-9cf6a036fbad', -- Merchant user
    'd75dfaf6-592f-41dd-ac9b-c942812ac304', -- Seller user
    '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92'  -- Warehouse user
)
ORDER BY email;

-- If test users don't exist, create placeholder profiles for them
DO $$
BEGIN
  -- Check if club user exists, if not create
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b') THEN
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
    VALUES (
      '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b',
      'club@goalsquad.se',
      'Club Owner',
      'user',
      true,
      true
    );
  END IF;
  
  -- Check if consumer user exists, if not create
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd8135a02-9540-46d6-b917-feb923d801e5') THEN
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
    VALUES (
      'd8135a02-9540-46d6-b917-feb923d801e5',
      'consumer@goalsquad.se',
      'Consumer User',
      'user',
      true,
      true
    );
  END IF;
  
  -- Check if merchant user exists, if not create
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '378b4494-5442-417a-ae29-9cf6a036fbad') THEN
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
    VALUES (
      '378b4494-5442-417a-ae29-9cf6a036fbad',
      'merchant@goalsquad.se',
      'Merchant User',
      'merchant',
      true,
      true
    );
  END IF;
  
  -- Check if seller user exists, if not create
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'd75dfaf6-592f-41dd-ac9b-c942812ac304') THEN
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
    VALUES (
      'd75dfaf6-592f-41dd-ac9b-c942812ac304',
      'seller@goalsquad.se',
      'Seller User',
      'seller',
      true,
      true
    );
  END IF;
  
  -- Check if warehouse user exists, if not create
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92') THEN
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
    VALUES (
      '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92',
      'warehouse@goalsquad.se',
      'Warehouse User',
      'warehouse',
      true,
      true
    );
  END IF;
END $$;

-- Verify all test users after creation/update
SELECT 
  'Test Users After Fix' as check_type,
  id,
  email,
  role,
  is_active,
  is_verified
FROM profiles
WHERE id IN (
    '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b', -- Club user
    'd8135a02-9540-46d6-b917-feb923d801e5', -- Consumer user
    '378b4494-5442-417a-ae29-9cf6a036fbad', -- Merchant user
    'd75dfaf6-592f-41dd-ac9b-c942812ac304', -- Seller user
    '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92'  -- Warehouse user
)
ORDER BY role, email;
