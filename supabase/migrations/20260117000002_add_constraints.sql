-- ============================================================================
-- Add Database Constraints (Data Integrity Hardening)
-- Date: 2026-01-17
-- Purpose: Enforce data quality at the database level
-- ============================================================================

-- 1. Transactions Constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_transactions_amount_positive') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_transactions_allocation_consistency') THEN
    ALTER TABLE public.transactions ADD CONSTRAINT chk_transactions_allocation_consistency
      CHECK ((member_id IS NULL AND group_id IS NULL) OR (member_id IS NOT NULL AND group_id IS NOT NULL));
  END IF;
END $$;

-- 2. Members Constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_members_phone_format') THEN
    ALTER TABLE public.members ADD CONSTRAINT chk_members_phone_format CHECK (phone ~ '^\+?[0-9]{10,15}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_members_full_name_not_empty') THEN
    ALTER TABLE public.members ADD CONSTRAINT chk_members_full_name_not_empty CHECK (TRIM(full_name) != '');
  END IF;
END $$;

-- 3. Groups Constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_groups_name_not_empty') THEN
    ALTER TABLE public.groups ADD CONSTRAINT chk_groups_name_not_empty CHECK (TRIM(name) != '');
  END IF;
END $$;

-- 4. Institution Settings Constraints
-- NOTE: Skipped - parsing_threshold and dedupe_window_minutes columns do not exist in current schema
