-- ============================================================================
-- RLS Policy Verification and Enhancement
-- Date: 2026-01-13
-- Purpose: Verify RLS is enabled on all tables and add helper functions
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on all sensitive tables
-- ============================================================================

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE momo_sms_raw ENABLE ROW LEVEL SECURITY;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_momo_codes ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 2: Create enhanced helper functions
-- ============================================================================

-- can_read_institution: Check if user can read data from an institution
CREATE OR REPLACE FUNCTION public.can_read_institution(inst_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    public.is_platform_admin() OR 
    public.current_institution_id() = inst_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- can_write_institution: Check if user can write data to an institution
CREATE OR REPLACE FUNCTION public.can_write_institution(inst_id UUID)
RETURNS BOOLEAN AS $$
  SELECT 
    public.is_platform_admin() OR 
    (public.current_institution_id() = inst_id AND 
     (SELECT role NOT IN ('INSTITUTION_AUDITOR')
      FROM profiles WHERE user_id = auth.uid()));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- is_institution_auditor: Check if user is an auditor
CREATE OR REPLACE FUNCTION public.is_institution_auditor()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'INSTITUTION_AUDITOR' FROM profiles WHERE user_id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 3: Update audit_log RLS policies for auditor access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_access" ON public.audit_log;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;

-- Auditors and Admins can view audit logs for their institution
CREATE POLICY "audit_log_select" ON public.audit_log
FOR SELECT USING (
  public.is_platform_admin() OR 
  (public.current_institution_id() = institution_id AND 
   (SELECT role IN ('INSTITUTION_ADMIN', 'INSTITUTION_AUDITOR')
    FROM profiles WHERE user_id = auth.uid()))
);

-- System and authenticated users can insert audit logs
CREATE POLICY "audit_log_insert" ON public.audit_log
FOR INSERT WITH CHECK (true);

-- ============================================================================
-- STEP 4: Verify institution_momo_codes RLS
-- ============================================================================

DROP POLICY IF EXISTS "institution_momo_codes_select" ON public.institution_momo_codes;
DROP POLICY IF EXISTS "institution_momo_codes_insert" ON public.institution_momo_codes;
DROP POLICY IF EXISTS "institution_momo_codes_update" ON public.institution_momo_codes;
DROP POLICY IF EXISTS "institution_momo_codes_delete" ON public.institution_momo_codes;

CREATE POLICY "institution_momo_codes_select" ON public.institution_momo_codes
FOR SELECT USING (public.can_read_institution(institution_id));

CREATE POLICY "institution_momo_codes_insert" ON public.institution_momo_codes
FOR INSERT WITH CHECK (public.can_write_institution(institution_id));

CREATE POLICY "institution_momo_codes_update" ON public.institution_momo_codes
FOR UPDATE USING (public.can_write_institution(institution_id));

CREATE POLICY "institution_momo_codes_delete" ON public.institution_momo_codes
FOR DELETE USING (public.can_write_institution(institution_id));

-- ============================================================================
-- STEP 5: Verify transaction_allocations RLS
-- ============================================================================



-- ============================================================================
-- STEP 7: Grant execute permissions on helper functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.can_read_institution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_institution(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_institution_auditor() TO authenticated;

-- ============================================================================
-- STEP 8: Verification query (for manual check)
-- ============================================================================

DO $$
DECLARE
  v_table RECORD;
  v_rls_disabled TEXT := '';
BEGIN
  FOR v_table IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
      'institutions', 'profiles', 'groups', 'members', 'transactions', 
      'groups', 'members', 'transactions', 'momo_sms_raw', 'audit_log', 'group_members',
      'institution_momo_codes'
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = v_table.tablename 
      AND rowsecurity = true
    ) THEN
      v_rls_disabled := v_rls_disabled || v_table.tablename || ', ';
    END IF;
  END LOOP;
  
  IF v_rls_disabled != '' THEN
    RAISE NOTICE 'WARNING: RLS not enabled on: %', v_rls_disabled;
  ELSE
    RAISE NOTICE 'SUCCESS: RLS enabled on all sensitive tables';
  END IF;
END $$;

-- ============================================================================
-- End of migration
-- ============================================================================
