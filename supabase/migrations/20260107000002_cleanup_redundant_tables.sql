-- ============================================================================
-- CLEANUP: Remove redundant/obsolete tables
-- Date: 2025-01-07
-- ============================================================================
-- This migration removes tables that are:
-- 1. Redundant (replaced by better alternatives)
-- 2. Obsolete (features removed)
-- 3. Duplicates (consolidated into other tables)
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop redundant tables
-- ============================================================================

-- admin_users: Redundant with profiles table (which handles all staff/admin users)
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- device_keys: Obsolete - NFC/device features were removed
DROP TABLE IF EXISTS public.device_keys CASCADE;

-- mobile_money_ussd_codes: Redundant with institution_momo_codes
-- First migrate any data if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mobile_money_ussd_codes') THEN
    -- Migrate data to institution_momo_codes if not already there
    INSERT INTO public.institution_momo_codes (institution_id, momo_code, is_active)
    SELECT DISTINCT institution_id, ussd_code, true
    FROM public.mobile_money_ussd_codes
    WHERE institution_id IS NOT NULL
      AND ussd_code IS NOT NULL
    ON CONFLICT (institution_id, momo_code) DO NOTHING;
    
    RAISE NOTICE 'Migrated mobile_money_ussd_codes to institution_momo_codes';
  END IF;
END $$;

DROP TABLE IF EXISTS public.mobile_money_ussd_codes CASCADE;

-- reconciliation_issues: Replaced by reconciliation_sessions + reconciliation_items
-- First migrate any data if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reconciliation_issues') THEN
    -- Note: Old reconciliation_issues table had different structure
    -- We're not migrating data as the new workflow is session-based
    -- Archived issues should be reviewed manually if needed
    RAISE NOTICE 'reconciliation_issues table will be dropped - data not migrated (new session-based workflow)';
  END IF;
END $$;

DROP TABLE IF EXISTS public.reconciliation_issues CASCADE;

-- ============================================================================
-- STEP 2: Ensure transactions table exists with correct structure
-- ============================================================================

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  momo_sms_id uuid REFERENCES public.momo_sms_raw(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount numeric(16, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'RWF',
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'COMPLETED',
  reference text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  payer_phone text,
  payer_name text,
  momo_ref text,
  payer_ref text,
  parse_confidence numeric(3, 2) DEFAULT 1.0 CHECK (parse_confidence >= 0 AND parse_confidence <= 1),
  allocation_status text DEFAULT 'unallocated' CHECK (allocation_status IN ('unallocated', 'allocated', 'error', 'duplicate', 'reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_institution_id ON public.transactions(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON public.transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_momo_sms_id ON public.transactions(momo_sms_id);
CREATE INDEX IF NOT EXISTS idx_transactions_allocation_status ON public.transactions(allocation_status) WHERE allocation_status = 'unallocated';
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON public.transactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy for transactions
DROP POLICY IF EXISTS "transactions_access" ON public.transactions;
CREATE POLICY "transactions_access"
ON public.transactions
FOR ALL
USING (public.is_platform_admin() OR institution_id = public.current_institution_id())
WITH CHECK (public.is_platform_admin() OR institution_id = public.current_institution_id());

-- ============================================================================
-- STEP 3: Ensure settings table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.settings (
  institution_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  system_name text NOT NULL DEFAULT 'SACCO+ Admin Portal',
  support_email text,
  base_currency text NOT NULL DEFAULT 'RWF',
  momo_shortcode text,
  momo_merchant_id text,
  auto_reconcile boolean NOT NULL DEFAULT true,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_access" ON public.settings;
CREATE POLICY "settings_access"
ON public.settings
FOR ALL
USING (public.is_platform_admin() OR institution_id = public.current_institution_id())
WITH CHECK (public.is_platform_admin() OR institution_id = public.current_institution_id());

-- ============================================================================
-- STEP 4: Ensure branches table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  manager_name text,
  manager_phone text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_branches_institution_id ON public.branches(institution_id);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branches_access" ON public.branches;
CREATE POLICY "branches_access"
ON public.branches
FOR ALL
USING (public.is_platform_admin() OR institution_id = public.current_institution_id())
WITH CHECK (public.is_platform_admin() OR institution_id = public.current_institution_id());

-- ============================================================================
-- STEP 5: Summary
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== CLEANUP COMPLETE ===';
  RAISE NOTICE 'Deleted: admin_users, device_keys, mobile_money_ussd_codes, reconciliation_issues';
  RAISE NOTICE 'Ensured: transactions, settings, branches tables exist';
END $$;

