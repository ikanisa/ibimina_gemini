-- ============================================================================
-- Performance Indexes Migration
-- Date: 2026-01-13
-- Purpose: Add comprehensive indexes for query performance
-- ============================================================================

-- ============================================================================
-- TRANSACTIONS TABLE INDEXES
-- ============================================================================

-- Allocation status filtering (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_transactions_allocation_status 
  ON transactions(allocation_status);

-- Institution + status composite for filtered lists
CREATE INDEX IF NOT EXISTS idx_transactions_institution_alloc_status 
  ON transactions(institution_id, allocation_status);

-- Institution + date for time-based queries
CREATE INDEX IF NOT EXISTS idx_transactions_inst_occurred_desc 
  ON transactions(institution_id, occurred_at DESC);

-- Unallocated transactions partial index (very common query)
CREATE INDEX IF NOT EXISTS idx_transactions_unallocated 
  ON transactions(institution_id, occurred_at DESC) 
  WHERE allocation_status = 'unallocated';

-- ============================================================================
-- MOMO_SMS_RAW TABLE INDEXES
-- ============================================================================



-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_momo_sms_raw_received_desc 
  ON momo_sms_raw(received_at DESC);

-- Parse status filtering
CREATE INDEX IF NOT EXISTS idx_momo_sms_raw_parse_status_inst 
  ON momo_sms_raw(institution_id, parse_status);



-- ============================================================================
-- MEMBERS TABLE INDEXES
-- ============================================================================

-- Group membership lookups
CREATE INDEX IF NOT EXISTS idx_members_group_id 
  ON members(group_id) 
  WHERE group_id IS NOT NULL;

-- Phone-based verification
CREATE INDEX IF NOT EXISTS idx_members_inst_phone 
  ON members(institution_id, phone);

-- Institution + status for filtered lists
CREATE INDEX IF NOT EXISTS idx_members_inst_status 
  ON members(institution_id, status);

-- ============================================================================
-- GROUPS TABLE INDEXES
-- ============================================================================

-- Institution groups listing
CREATE INDEX IF NOT EXISTS idx_groups_inst_status 
  ON groups(institution_id, status);

-- Group name search
CREATE INDEX IF NOT EXISTS idx_groups_inst_name 
  ON groups(institution_id, group_name);

-- ============================================================================
-- GROUP_MEMBERS TABLE INDEXES
-- ============================================================================

-- Composite lookup for group membership checks
CREATE INDEX IF NOT EXISTS idx_group_members_group_member 
  ON group_members(group_id, member_id);

-- Member's groups lookup
CREATE INDEX IF NOT EXISTS idx_group_members_member_id 
  ON group_members(member_id);

-- ============================================================================
-- AUDIT_LOG TABLE INDEXES
-- ============================================================================

-- Institution + time for filtered audit views
CREATE INDEX IF NOT EXISTS idx_audit_log_inst_time 
  ON audit_log(institution_id, created_at DESC);

-- User activity tracking
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time 
  ON audit_log(actor_user_id, created_at DESC);

-- Action-based filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_action_time 
  ON audit_log(action, created_at DESC);

-- Entity lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_lookup 
  ON audit_log(entity_type, entity_id);

-- ============================================================================
-- SMS_SOURCES TABLE INDEXES  
-- ============================================================================



-- ============================================================================
-- ANALYZE TABLES FOR OPTIMIZER
-- ============================================================================

ANALYZE transactions;
ANALYZE momo_sms_raw;
ANALYZE members;
ANALYZE groups;
ANALYZE group_members;
ANALYZE audit_log;


-- ============================================================================
-- End of migration
-- ============================================================================
