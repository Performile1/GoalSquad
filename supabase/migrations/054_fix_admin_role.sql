-- Fix admin user role to ensure admin@goalsquad.se has gs_admin role
-- This migration ensures the admin user has the correct role for routing

UPDATE profiles
SET role = 'gs_admin',
    is_verified = true,
    is_active = true
WHERE email = 'admin@goalsquad.se';

-- If no admin user exists, create one (this should not happen in production)
-- This is a safety check
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@goalsquad.se') THEN
    -- Note: This requires the user to exist in auth.users first
    -- This is just a placeholder - in reality, admin should be created via Supabase dashboard
    RAISE NOTICE 'Admin user not found in profiles table. Please create via Supabase dashboard.';
  END IF;
END $$;

-- Verify the admin role is set correctly
SELECT 
  id,
  email,
  full_name,
  role,
  is_verified,
  is_active
FROM profiles 
WHERE email = 'admin@goalsquad.se';
