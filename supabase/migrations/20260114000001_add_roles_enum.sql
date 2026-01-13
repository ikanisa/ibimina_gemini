-- ============================================================================
-- Migration: Add New Role Enum Values
-- Date: 2026-01-14
-- Purpose: Add 'ADMIN' and 'STAFF' to user_role enum.
--          Must be in a separate transaction from usage.
-- ============================================================================

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'STAFF';
EXCEPTION
  WHEN duplicate_object THEN 
    NULL;
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter enum type: %', SQLERRM;
END $$;
