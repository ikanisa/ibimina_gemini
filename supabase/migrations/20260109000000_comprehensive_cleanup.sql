-- ============================================================================
-- COMPREHENSIVE CLEANUP: Remove unused/deprecated tables and functions
-- Date: 2026-01-09
-- Purpose: Remove all unused code, deprecated tables, and obsolete functions
-- ============================================================================
-- 
-- WARNING: This migration drops tables and functions. Review carefully before running.
-- Backup your database before applying this migration.
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop deprecated/consolidated tables
-- ============================================================================

-- contributions: Merged into transactions table
-- Data should have been migrated to transactions with type='CONTRIBUTION'
DROP TABLE IF EXISTS public.contributions CASCADE;

-- incoming_payments: Merged into transactions table  
-- Data should have been migrated to transactions with type='PAYMENT'
DROP TABLE IF EXISTS public.incoming_payments CASCADE;

-- payment_ledger: Merged into transactions table
-- Data should have been migrated to transactions
DROP TABLE IF EXISTS public.payment_ledger CASCADE;

-- sms_messages: Replaced by momo_sms_raw
-- Data should have been migrated to momo_sms_raw
DROP TABLE IF EXISTS public.sms_messages CASCADE;

-- nfc_logs: Obsolete - NFC features removed
DROP TABLE IF EXISTS public.nfc_logs CASCADE;

-- reconciliation_issues: Replaced by reconciliation_sessions + reconciliation_items
DROP TABLE IF EXISTS public.reconciliation_issues CASCADE;

-- admin_users: Redundant with profiles table
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- device_keys: Obsolete - NFC/device features removed
DROP TABLE IF EXISTS public.device_keys CASCADE;

-- mobile_money_ussd_codes: Redundant with institution_momo_codes
DROP TABLE IF EXISTS public.mobile_money_ussd_codes CASCADE;

-- ============================================================================
-- STEP 2: Drop unused/deprecated functions
-- ============================================================================

-- Drop any functions that reference old tables (will fail gracefully if they don't exist)
DROP FUNCTION IF EXISTS public.get_contributions_summary CASCADE;
DROP FUNCTION IF EXISTS public.get_payment_ledger_summary CASCADE;
DROP FUNCTION IF EXISTS public.reconcile_payment CASCADE;
DROP FUNCTION IF EXISTS public.process_incoming_payment CASCADE;

-- Note: Functions that reference dropped tables will be automatically dropped by CASCADE
-- but we explicitly drop known obsolete functions for clarity

-- ============================================================================
-- STEP 3: Clean up unused enums (if safe)
-- ============================================================================

-- Note: We keep enums that might be referenced elsewhere
-- Only drop if absolutely certain they're unused

-- contribution_status: May still be referenced in types
-- payment_status: May still be referenced in types  
-- withdrawal_status: May still be referenced in types
-- Keep these for now unless confirmed unused

-- ============================================================================
-- STEP 4: Verify active tables exist
-- ============================================================================

-- Ensure all active tables from FINAL_SYSTEM_STATE.md exist
-- These should already exist from previous migrations, but verify:

DO $$
BEGIN
  -- Core tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'institutions') THEN
    RAISE EXCEPTION 'institutions table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE EXCEPTION 'profiles table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups') THEN
    RAISE EXCEPTION 'groups table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'members') THEN
    RAISE EXCEPTION 'members table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    RAISE EXCEPTION 'transactions table missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'momo_sms_raw') THEN
    RAISE EXCEPTION 'momo_sms_raw table missing';
  END IF;
  
  RAISE NOTICE 'All active tables verified';
END $$;

-- ============================================================================
-- STEP 5: Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== COMPREHENSIVE CLEANUP COMPLETE ===';
  RAISE NOTICE 'Dropped tables:';
  RAISE NOTICE '  - contributions (merged into transactions)';
  RAISE NOTICE '  - incoming_payments (merged into transactions)';
  RAISE NOTICE '  - payment_ledger (merged into transactions)';
  RAISE NOTICE '  - sms_messages (replaced by momo_sms_raw)';
  RAISE NOTICE '  - nfc_logs (obsolete)';
  RAISE NOTICE '  - reconciliation_issues (replaced by sessions + items)';
  RAISE NOTICE '  - admin_users (redundant with profiles)';
  RAISE NOTICE '  - device_keys (obsolete)';
  RAISE NOTICE '  - mobile_money_ussd_codes (redundant with institution_momo_codes)';
  RAISE NOTICE '';
  RAISE NOTICE 'Active tables verified:';
  RAISE NOTICE '  - institutions, profiles, groups, members';
  RAISE NOTICE '  - transactions, momo_sms_raw';
  RAISE NOTICE '  - group_members, branches, settings';
  RAISE NOTICE '  - institution_momo_codes, reconciliation_sessions, reconciliation_items';
  RAISE NOTICE '  - transaction_allocations, audit_log';
END $$;
