-- Check admin user role
SELECT 
  id,
  email,
  full_name,
  role,
  is_verified,
  is_active
FROM profiles 
WHERE email = 'admin@goalsquad.se';

-- Check all users with gs_admin role
SELECT 
  id,
  email,
  full_name,
  role,
  is_verified,
  is_active
FROM profiles 
WHERE role = 'gs_admin';
