-- ============================================================================
-- Data Constraints Migration
-- Date: 2026-01-13
-- Purpose: Add database constraints for data integrity validation
-- ============================================================================

-- ============================================================================
-- TRANSACTIONS TABLE CONSTRAINTS
-- ============================================================================

-- Allocation consistency: member and group must both be null or both set
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_allocation_consistency') THEN
    ALTER TABLE transactions 
      ADD CONSTRAINT chk_allocation_consistency 
      CHECK (
        (member_id IS NULL AND group_id IS NULL) OR 
        (member_id IS NOT NULL AND group_id IS NOT NULL)
      );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- MEMBERS TABLE CONSTRAINTS
-- ============================================================================

-- Phone format validation (10-15 digits, optional leading +)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_member_phone_format') THEN
    ALTER TABLE members 
      ADD CONSTRAINT chk_member_phone_format 
      CHECK (phone ~ '^\+?[0-9]{10,15}$');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    -- If existing data violates constraint, log and skip
    RAISE NOTICE 'Existing data violates phone format constraint - skipping';
END $$;

-- Name not empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_member_name_not_empty') THEN
    ALTER TABLE members 
      ADD CONSTRAINT chk_member_name_not_empty 
      CHECK (TRIM(full_name) != '');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    RAISE NOTICE 'Existing data violates name constraint - skipping';
END $$;

-- ============================================================================
-- GROUPS TABLE CONSTRAINTS
-- ============================================================================

-- Group name not empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_group_name_not_empty') THEN
    ALTER TABLE groups 
      ADD CONSTRAINT chk_group_name_not_empty 
      CHECK (TRIM(group_name) != '');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    RAISE NOTICE 'Existing data violates group name constraint - skipping';
END $$;



-- ============================================================================
-- INSTITUTIONS TABLE CONSTRAINTS
-- (Settings fields were consolidated into institutions table)
-- ============================================================================

-- Confidence threshold range (0-1)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_confidence_threshold_range') THEN
    -- Check if column exists first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'institutions' 
      AND column_name = 'confidence_threshold'
    ) THEN
      ALTER TABLE institutions 
        ADD CONSTRAINT chk_confidence_threshold_range 
        CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1);
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Dedupe window positive
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dedupe_window_positive') THEN
    -- Check if column exists first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'institutions' 
      AND column_name = 'dedupe_window_minutes'
    ) THEN
      ALTER TABLE institutions 
        ADD CONSTRAINT chk_dedupe_window_positive 
        CHECK (dedupe_window_minutes > 0);
    END IF;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PROFILES TABLE CONSTRAINTS
-- ============================================================================

-- Email format (basic validation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_profile_email_format') THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT chk_profile_email_format 
      CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    RAISE NOTICE 'Existing data violates email format constraint - skipping';
END $$;

-- ============================================================================
-- End of migration
-- ============================================================================
