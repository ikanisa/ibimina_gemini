-- ============================================================================
-- Add Database Indexes (Performance Hardening)
-- Date: 2026-01-17
-- Purpose: Add critical indexes for RLS performance and list queries
-- ============================================================================

-- 1. Transactions Indexes
-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_transactions_institution_id ON public.transactions(institution_id);
CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_transactions_group_id ON public.transactions(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at_desc ON public.transactions(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_allocation_status ON public.transactions(allocation_status);

-- Composite indexes for common filters
CREATE INDEX IF NOT EXISTS idx_transactions_inst_status ON public.transactions(institution_id, allocation_status);
CREATE INDEX IF NOT EXISTS idx_transactions_inst_occurred ON public.transactions(institution_id, occurred_at DESC);

-- 2. MoMo SMS Raw Indexes
-- institution_code not found in schema, assuming institution_id
CREATE INDEX IF NOT EXISTS idx_momo_sms_institution_id ON public.momo_sms_raw(institution_id);
CREATE INDEX IF NOT EXISTS idx_momo_sms_received_at_desc ON public.momo_sms_raw(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_momo_sms_parse_status ON public.momo_sms_raw(parse_status);
-- Note: hash column doesn't exist in schema, skipped idx_momo_sms_hash

-- 3. Members Indexes
CREATE INDEX IF NOT EXISTS idx_members_group_id ON public.members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_institution_id ON public.members(institution_id);
CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);

-- 4. Groups Indexes
CREATE INDEX IF NOT EXISTS idx_groups_institution_id ON public.groups(institution_id);

-- 5. Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_institution_id ON public.audit_log(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_desc ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

-- 6. Comment
COMMENT ON INDEX idx_transactions_inst_status IS 'Composite index for filtering unallocated/allocated transactions by institution';
COMMENT ON INDEX idx_transactions_inst_occurred IS 'Composite index for listing transactions chronologically by institution';
