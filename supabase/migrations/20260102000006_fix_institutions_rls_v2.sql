-- Fix institutions RLS to allow all authenticated users to read
-- This migration replaces previous RLS policies

-- First, drop ALL existing policies on institutions
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'institutions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.institutions', pol.policyname);
  END LOOP;
END $$;

-- Now create the correct policies
-- 1. Allow ALL authenticated users to SELECT (read) institutions
CREATE POLICY "allow_authenticated_select"
ON public.institutions
FOR SELECT
TO authenticated
USING (true);

-- 2. Only platform admins can INSERT/UPDATE/DELETE
CREATE POLICY "allow_admin_all"
ON public.institutions
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
