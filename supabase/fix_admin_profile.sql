-- Run this in Supabase SQL editor to fix admin user profile
-- The user must already exist in auth.users

-- Check if profile exists
SELECT id, email, role FROM profiles WHERE id = '4413b038-d4a9-4916-93c0-c6959a0b8d1c';

-- Insert or update admin profile
INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
VALUES (
  '4413b038-d4a9-4916-93c0-c6959a0b8d1c',
  'admin@goalsquad.se',
  'GoalSquad Admin',
  'gs_admin',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'gs_admin',
  is_active = true,
  is_verified = true;

-- Verify result
SELECT id, email, role, is_active, is_verified FROM profiles WHERE id = '4413b038-d4a9-4916-93c0-c6959a0b8d1c';
