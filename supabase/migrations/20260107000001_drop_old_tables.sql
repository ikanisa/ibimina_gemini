-- ============================================================================
-- Drop old/duplicate tables after data migration
-- Run this AFTER verifying data migration was successful
-- ============================================================================

-- Drop old tables (data already migrated to transactions/momo_sms_raw)
-- These are idempotent, so safe to run multiple times

drop table if exists public.contributions cascade;
drop table if exists public.incoming_payments cascade;
drop table if exists public.payment_ledger cascade;

-- Note: sms_messages is kept for now (some frontend code might still reference it)
-- Drop it in a later migration after frontend is updated:
-- drop table if exists public.sms_messages cascade;

-- Note: reconciliation_issues can be dropped if we've migrated the data
-- (Currently we're creating new tables, not migrating from old one)
-- Uncomment when ready:
-- drop table if exists public.reconciliation_issues cascade;


