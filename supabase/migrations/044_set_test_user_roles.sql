-- Set correct roles for test users

-- Update club user (community owner)
UPDATE profiles
SET role = 'user',
    is_active = true,
    is_verified = true
WHERE id = '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b';

-- Update consumer user
UPDATE profiles
SET role = 'user',
    is_active = true,
    is_verified = true
WHERE id = 'd8135a02-9540-46d6-b917-feb923d801e5';

-- Update merchant user
UPDATE profiles
SET role = 'merchant',
    is_active = true,
    is_verified = true
WHERE id = '378b4494-5442-417a-ae29-9cf6a036fbad';

-- Update seller user
UPDATE profiles
SET role = 'seller',
    is_active = true,
    is_verified = true
WHERE id = 'd75dfaf6-592f-41dd-ac9b-c942812ac304';

-- Update warehouse user
UPDATE profiles
SET role = 'warehouse',
    is_active = true,
    is_verified = true
WHERE id = '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92';

-- Verify the updates
SELECT id, email, role, is_active, is_verified
FROM profiles
WHERE id IN (
    '3d2ee9bc-51bf-4cb5-a809-34cfcb5cf27b',
    'd8135a02-9540-46d6-b917-feb923d801e5',
    '378b4494-5442-417a-ae29-9cf6a036fbad',
    'd75dfaf6-592f-41dd-ac9b-c942812ac304',
    '980c0f71-a9db-4d18-a7d1-fa8f5a91cd92'
)
ORDER BY email;
