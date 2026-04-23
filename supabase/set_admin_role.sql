-- Set gs_admin role for the admin user
UPDATE public.profiles
SET role = 'gs_admin',
    is_active = true,
    is_verified = true
WHERE email = 'admin@goalsquad.se';

-- Verify the update
SELECT id, email, full_name, role, is_active, is_verified
FROM public.profiles
WHERE email = 'admin@goalsquad.se';
