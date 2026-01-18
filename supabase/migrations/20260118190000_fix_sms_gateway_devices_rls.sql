-- ============================================================================
-- Fix SMS Gateway Devices RLS Policies
-- Purpose: Allow ADMIN users to manage devices for any institution
-- Date: 2026-01-18
-- ============================================================================
-- 
-- Problem: Current RLS policy blocks INSERT/UPDATE/DELETE because:
--   1. The `sms_gateway_devices_manage_own_institution` policy checks if
--      institution_id matches the user's profile.institution_id
--   2. Admin users have institution_id = NULL in their profiles
--   3. NULL IN (...) evaluates to FALSE, blocking all writes
--
-- Solution: 
--   1. Drop the restrictive policy
--   2. Create new policies that allow ADMINs full access
--   3. Keep institution-scoped access for STAFF users
-- ============================================================================

-- Drop the conflicting policy that blocks admin writes
DROP POLICY IF EXISTS "sms_gateway_devices_manage_own_institution" ON public.sms_gateway_devices;

-- Drop old write policy (we'll recreate with better logic)
DROP POLICY IF EXISTS "write_devices_authenticated" ON public.sms_gateway_devices;

-- Create new INSERT policy
-- Admins can insert for any institution, staff only for their institution
CREATE POLICY "sms_gateway_devices_insert"
ON public.sms_gateway_devices
FOR INSERT
TO authenticated
WITH CHECK (
  -- ADMINs can insert devices for any institution
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
  OR
  -- STAFF can only insert for their own institution
  (
    institution_id IN (
      SELECT profiles.institution_id 
      FROM profiles 
      WHERE profiles.user_id = auth.uid()
      AND profiles.institution_id IS NOT NULL
    )
  )
);

-- Create new UPDATE policy
CREATE POLICY "sms_gateway_devices_update"
ON public.sms_gateway_devices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
  OR
  institution_id IN (
    SELECT profiles.institution_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
    AND profiles.institution_id IS NOT NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
  OR
  institution_id IN (
    SELECT profiles.institution_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
    AND profiles.institution_id IS NOT NULL
  )
);

-- Create new DELETE policy
CREATE POLICY "sms_gateway_devices_delete"
ON public.sms_gateway_devices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'ADMIN'
  )
  OR
  institution_id IN (
    SELECT profiles.institution_id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
    AND profiles.institution_id IS NOT NULL
  )
);

-- Verify: Keep the existing SELECT policy (read_devices_authenticated) which allows all reads
-- This was already in place and working correctly.

-- ============================================================================
-- Summary of final policies on sms_gateway_devices:
-- 1. read_devices_authenticated - SELECT for all authenticated users
-- 2. sms_gateway_devices_insert - INSERT for ADMINs or matching institution
-- 3. sms_gateway_devices_update - UPDATE for ADMINs or matching institution  
-- 4. sms_gateway_devices_delete - DELETE for ADMINs or matching institution
-- ============================================================================
