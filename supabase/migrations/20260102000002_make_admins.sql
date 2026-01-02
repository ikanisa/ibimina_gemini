-- Update existing users to PLATFORM_ADMIN role
UPDATE public.profiles 
SET role = 'PLATFORM_ADMIN', 
    branch = 'HQ',
    status = 'ACTIVE',
    updated_at = now()
WHERE email IN ('info@ikanisa.com', 'bosco@ikanisa.com');

-- If profiles don't exist for these users, create them
INSERT INTO public.profiles (user_id, email, full_name, role, branch, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'PLATFORM_ADMIN'::user_role,
  'HQ',
  'ACTIVE'::staff_status
FROM auth.users au
WHERE au.email IN ('info@ikanisa.com', 'bosco@ikanisa.com')
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = au.id)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'PLATFORM_ADMIN',
  status = 'ACTIVE',
  updated_at = now();
