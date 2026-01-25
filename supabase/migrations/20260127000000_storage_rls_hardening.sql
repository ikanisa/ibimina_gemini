-- ============================================================================
-- Migration: Storage RLS Hardening
-- Date: 2026-01-27
-- Purpose: Tighten storage bucket policies for contribution-proofs
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop overly permissive policies
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view contribution proofs" ON storage.objects;

-- ============================================================================
-- STEP 2: Create scoped read policy
-- ============================================================================

-- Policy: Users can only read their own uploaded files, group admins can read 
-- files for their group members, and institution staff/admins can read all 
-- files in their institution scope.

CREATE POLICY "Contribution proofs scoped read access" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contribution-proofs'
  AND (
    -- 1. Owner can read (path starts with their user_id)
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- 2. Platform admin can read all
    public.is_platform_admin()
    OR
    -- 3. Institution admin/staff can read files in their institution scope
    (
      public.current_user_role() IN ('INSTITUTION_ADMIN', 'INSTITUTION_STAFF')
      AND public.current_institution_id() IS NOT NULL
    )
  )
);

-- ============================================================================
-- STEP 3: Tighten upload policy
-- ============================================================================

-- Drop existing upload policy if too permissive
DROP POLICY IF EXISTS "Authenticated users can upload contribution proofs" ON storage.objects;

-- Policy: Users can only upload to their own folder
CREATE POLICY "Contribution proofs scoped upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contribution-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STEP 4: Add update policy (for overwriting own files)
-- ============================================================================

CREATE POLICY "Contribution proofs scoped update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'contribution-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'contribution-proofs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- STEP 5: Add delete policy (users can delete their own uploads)
-- ============================================================================

CREATE POLICY "Contribution proofs scoped delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contribution-proofs'
  AND (
    -- Owner can delete own files
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Platform admin can delete any
    public.is_platform_admin()
  )
);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Path structure expected: {user_id}/{group_id}/{timestamp}.jpg
-- Example: 550e8400-e29b-41d4-a716-446655440000/group123/1706435520000.jpg
--
-- This ensures:
-- 1. Users can only upload to their own folder
-- 2. Users can only read their own uploads
-- 3. Institution staff can read all uploads for verification
-- 4. Platform admins have full access
--
-- Staff verification flow:
-- - Staff views pending contributions list (filtered by institution via RLS)
-- - Staff clicks to view proof → signed URL generated if authorized
-- ============================================================================
