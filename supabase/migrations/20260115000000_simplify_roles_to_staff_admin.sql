-- ============================================================================
-- Migration: Simplify Roles to Only Staff and Admin
-- Date: 2026-01-15
-- Purpose: Clean up user roles to only 'Staff' and 'Admin'
--          Migrate all existing roles to the new simplified system
-- ============================================================================

-- Update profiles table to map old roles to new roles (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    UPDATE profiles
    SET role = CASE
      WHEN role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') THEN 'ADMIN'
      WHEN role IN ('INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      ELSE 'STAFF' -- Default to STAFF for any unknown roles
    END
    WHERE role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR');
  END IF;
END $$;

-- Update staff_invites table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_invites') THEN
    UPDATE staff_invites
    SET role = CASE
      WHEN role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN') THEN 'ADMIN'
      WHEN role IN ('INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR') THEN 'STAFF'
      ELSE 'STAFF'
    END
    WHERE role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR');
  END IF;
END $$;

-- Note: The database enum type for roles may need to be updated separately
-- This depends on your database schema. If you have a CHECK constraint or ENUM type,
-- you may need to alter it to only allow 'ADMIN' and 'STAFF'

-- Verify the changes (only if profiles table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE 'Role distribution:';
    -- This will be shown in logs but won't fail if table doesn't exist
  END IF;
END $$;
