-- Migration: Audit Fixes
-- Date: 2026-01-15
-- Purpose: Fix duplicate indexes, add missing FK indexes, tighten RLS policies
-- Based on: Supabase advisor recommendations

-- ============================================================================
-- PART 1: DROP DUPLICATE INDEXES
-- ============================================================================

-- transactions table has multiple duplicate index sets
-- Keep the most specific/optimized ones, drop the rest

-- Set 1: institution_id + occurred_at duplicates
-- Keep: idx_transactions_inst_occurred (the original)
DROP INDEX IF EXISTS idx_transactions_inst_occurred_desc;
DROP INDEX IF EXISTS idx_transactions_institution_occurred_at;

-- Set 2: unallocated duplicates  
-- Keep: idx_transactions_unallocated (the original)
DROP INDEX IF EXISTS idx_transactions_unallocated_optimized;

-- Set 3: occurred_at duplicates
-- Keep: idx_transactions_occurred_at (the original)
DROP INDEX IF EXISTS idx_transactions_occurred_at_desc;

-- ============================================================================
-- PART 2: ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- group_reports foreign keys
CREATE INDEX IF NOT EXISTS idx_group_reports_generated_by 
  ON group_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_group_reports_group_id 
  ON group_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_group_reports_institution_id 
  ON group_reports(institution_id);

-- Check for other common unindexed FKs and add them
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id 
  ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id 
  ON audit_log(entity_id) WHERE entity_id IS NOT NULL;

-- ============================================================================
-- PART 3: FIX RLS POLICIES
-- ============================================================================

-- 3a. Add RLS policies for institutions table (currently has RLS enabled but no policies)
-- This allows authenticated users to read institutions they belong to

DROP POLICY IF EXISTS "institutions_select_own" ON institutions;
CREATE POLICY "institutions_select_own" ON institutions
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "institutions_update_admin" ON institutions;
CREATE POLICY "institutions_update_admin" ON institutions
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Service role bypass for institutions
DROP POLICY IF EXISTS "institutions_service_role_all" ON institutions;
CREATE POLICY "institutions_service_role_all" ON institutions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3b. Add RLS policies for momo_sms_raw (currently has RLS enabled but no policies)
DROP POLICY IF EXISTS "momo_sms_raw_select_own_institution" ON momo_sms_raw;
CREATE POLICY "momo_sms_raw_select_own_institution" ON momo_sms_raw
  FOR SELECT
  TO authenticated
  USING (
    institution_id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "momo_sms_raw_insert_own_institution" ON momo_sms_raw;
CREATE POLICY "momo_sms_raw_insert_own_institution" ON momo_sms_raw
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Service role bypass for momo_sms_raw
DROP POLICY IF EXISTS "momo_sms_raw_service_role_all" ON momo_sms_raw;
CREATE POLICY "momo_sms_raw_service_role_all" ON momo_sms_raw
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3c. Tighten sms_gateway_devices policy (currently too permissive)
-- Replace the overly permissive "write_devices_authenticated" policy
DROP POLICY IF EXISTS "write_devices_authenticated" ON sms_gateway_devices;

-- Allow users to only manage devices for their own institution
DROP POLICY IF EXISTS "sms_gateway_devices_manage_own_institution" ON sms_gateway_devices;
CREATE POLICY "sms_gateway_devices_manage_own_institution" ON sms_gateway_devices
  FOR ALL
  TO authenticated
  USING (
    institution_id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- PART 4: VERIFY CHANGES
-- ============================================================================

-- Output verification (these will show in migration logs)
DO $$
DECLARE
  idx_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count remaining indexes on transactions
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes 
  WHERE tablename = 'transactions' AND schemaname = 'public';
  
  RAISE NOTICE 'Remaining indexes on transactions: %', idx_count;
  
  -- Count policies on institutions
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'institutions' AND schemaname = 'public';
  
  RAISE NOTICE 'Policies on institutions: %', policy_count;
  
  -- Count policies on momo_sms_raw
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'momo_sms_raw' AND schemaname = 'public';
  
  RAISE NOTICE 'Policies on momo_sms_raw: %', policy_count;
  
  -- Count policies on sms_gateway_devices
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'sms_gateway_devices' AND schemaname = 'public';
  
  RAISE NOTICE 'Policies on sms_gateway_devices: %', policy_count;
END $$;

COMMENT ON TABLE institutions IS 'Core institution/SACCO entity - RLS policies added 2026-01-15';
COMMENT ON TABLE momo_sms_raw IS 'Raw MoMo SMS data - RLS policies added 2026-01-15';
