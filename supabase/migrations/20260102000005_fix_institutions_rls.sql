-- Fix institutions RLS policy to allow all authenticated users to read
-- The institutions list is public reference data that all users should be able to see

-- Drop the restrictive policy
DROP POLICY IF EXISTS "institutions_access" on public.institutions;

-- Create separate SELECT policy (allow all authenticated users to read)
CREATE POLICY "institutions_select"
ON public.institutions
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create separate INSERT/UPDATE/DELETE policy (platform admins only)
CREATE POLICY "institutions_modify"
ON public.institutions
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
