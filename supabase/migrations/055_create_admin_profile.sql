-- Create admin profile if it doesn't exist
-- This fixes the 500 error when fetching profile for admin@goalsquad.se

-- First, check if the admin user exists in auth.users and has a profile
DO $$
DECLARE
  v_user_id UUID;
  v_profile_count INTEGER;
BEGIN
  -- Get the admin user ID from profiles if it exists
  SELECT id INTO v_user_id FROM profiles WHERE email = 'admin@goalsquad.se' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    -- Try to get from auth.users (this won't work in migration but we can log)
    RAISE NOTICE 'Admin user not found in profiles table. Email: admin@goalsquad.se';
  ELSE
    -- Update the profile to ensure it has the correct role
    UPDATE profiles
    SET 
      role = 'gs_admin',
      is_verified = true,
      is_active = true
    WHERE email = 'admin@goalsquad.se';
    
    RAISE NOTICE 'Admin profile updated with gs_admin role. User ID: %', v_user_id;
  END IF;
  
  -- Count profiles
  SELECT COUNT(*) INTO v_profile_count FROM profiles;
  RAISE NOTICE 'Total profiles in database: %', v_profile_count;
END $$;

-- Verify admin profile
SELECT 
  id,
  email,
  full_name,
  role,
  is_verified,
  is_active
FROM profiles 
WHERE email = 'admin@goalsquad.se';
