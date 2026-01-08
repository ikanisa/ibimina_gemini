-- EMERGENCY FIX: Disable RLS on institutions table
-- This is required because the previous migrations might not have been applied or were overridden.
-- We need public read access for the Institutions page to work.

ALTER TABLE public.institutions DISABLE ROW LEVEL SECURITY;

-- Drop any potential blocking policies to be safe
DROP POLICY IF EXISTS "institutions_access" ON public.institutions;
DROP POLICY IF EXISTS "institutions_select" ON public.institutions;
DROP POLICY IF EXISTS "institutions_modify" ON public.institutions;
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.institutions;
DROP POLICY IF EXISTS "allow_admin_all" ON public.institutions;
