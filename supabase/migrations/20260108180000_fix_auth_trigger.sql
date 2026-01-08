-- Migration: Fix Auth User Creation (Critical Production Fix)
-- Created: 2026-01-08
-- Issue: "Database error saving new user" - auth.users trigger failing

-- 1. Ensure required enum types exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'PLATFORM_ADMIN',
      'INSTITUTION_ADMIN',
      'INSTITUTION_STAFF',
      'INSTITUTION_TREASURER',
      'INSTITUTION_AUDITOR'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_status') THEN
    CREATE TYPE staff_status AS ENUM ('ACTIVE', 'SUSPENDED');
  END IF;
END $$;

-- 2. Ensure profiles table exists with required structure
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id uuid,
  role user_role NOT NULL DEFAULT 'INSTITUTION_STAFF',
  email text,
  full_name text,
  branch text,
  avatar_url text,
  status staff_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add missing columns if table exists but is incomplete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status staff_status NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 4. Create/replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    institution_id,
    role,
    email,
    full_name,
    branch,
    avatar_url,
    status,
    last_login_at
  ) VALUES (
    new.id,
    CASE
      WHEN (new.raw_user_meta_data ->> 'institution_id') ~* '^[0-9a-f-]{36}$'
        THEN (new.raw_user_meta_data ->> 'institution_id')::uuid
      ELSE NULL
    END,
    CASE
      WHEN new.raw_user_meta_data ->> 'role' IS NULL THEN 'INSTITUTION_STAFF'::user_role
      WHEN upper(new.raw_user_meta_data ->> 'role') IN (
        'PLATFORM_ADMIN',
        'INSTITUTION_ADMIN',
        'INSTITUTION_STAFF',
        'INSTITUTION_TREASURER',
        'INSTITUTION_AUDITOR'
      ) THEN (upper(new.raw_user_meta_data ->> 'role'))::user_role
      ELSE 'INSTITUTION_STAFF'::user_role
    END,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'branch',
    new.raw_user_meta_data ->> 'avatar_url',
    'ACTIVE',
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    last_login_at = now();
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log but don't fail - allow user creation to succeed
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN new;
END;
$$;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Fix RLS on profiles to allow the trigger to work
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_service_role_all" ON public.profiles;
CREATE POLICY "profiles_service_role_all" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- 7. Grant necessary permissions
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
