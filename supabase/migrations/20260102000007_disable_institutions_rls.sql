-- Fix institutions table RLS issue by disabling it
-- Institutions are public reference data that all users should see
-- This is the simplest and most reliable solution

-- Disable RLS on institutions table
ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies (cleanup)
DROP POLICY IF EXISTS "institutions_access" ON public.institutions;
DROP POLICY IF EXISTS "institutions_select" ON public.institutions;
DROP POLICY IF EXISTS "institutions_modify" ON public.institutions;
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.institutions;
DROP POLICY IF EXISTS "allow_admin_all" ON public.institutions;
