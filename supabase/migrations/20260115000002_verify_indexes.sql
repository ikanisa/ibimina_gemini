-- ============================================================================
-- Index Verification Script
-- Date: 2026-01-15
-- Purpose: Verify all critical indexes are created and being used
-- Run this manually in Supabase SQL Editor after applying migrations
-- ============================================================================

-- ============================================================================
-- STEP 1: List all indexes on critical tables
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'audit_log', 'transaction_allocations')
ORDER BY tablename, indexname;

-- ============================================================================
-- STEP 2: Check index usage statistics
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  CASE 
    WHEN idx_scan = 0 THEN '⚠️ UNUSED'
    WHEN idx_scan < 10 THEN '⚠️ LOW USAGE'
    ELSE '✅ ACTIVE'
  END as status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'audit_log', 'transaction_allocations')
ORDER BY idx_scan DESC, tablename, indexname;

-- ============================================================================
-- STEP 3: Check for missing critical indexes
-- ============================================================================

-- Check if critical indexes exist
SELECT 
  'transactions' as table_name,
  'idx_transactions_institution_id' as required_index,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_institution_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
UNION ALL
SELECT 
  'transactions',
  'idx_transactions_allocation_status',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_allocation_status'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'transactions',
  'idx_transactions_occurred_at',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_occurred_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'transactions',
  'idx_transactions_member_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_member_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'transactions',
  'idx_transactions_group_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'transactions' 
    AND indexname = 'idx_transactions_group_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'momo_sms_raw',
  'idx_momo_sms_raw_institution_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'momo_sms_raw' 
    AND indexname = 'idx_momo_sms_raw_institution_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'momo_sms_raw',
  'idx_momo_sms_raw_parse_status',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'momo_sms_raw' 
    AND indexname = 'idx_momo_sms_raw_parse_status'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'momo_sms_raw',
  'idx_momo_sms_raw_received_at',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'momo_sms_raw' 
    AND indexname = 'idx_momo_sms_raw_received_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'members',
  'idx_members_group_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'members' 
    AND indexname = 'idx_members_group_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'members',
  'idx_members_institution_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'members' 
    AND indexname = 'idx_members_institution_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'audit_log',
  'idx_audit_log_institution_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'audit_log' 
    AND indexname = 'idx_audit_log_institution_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'audit_log',
  'idx_audit_log_created_at',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'audit_log' 
    AND indexname = 'idx_audit_log_created_at'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END
UNION ALL
SELECT 
  'audit_log',
  'idx_audit_log_actor_user_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'audit_log' 
    AND indexname = 'idx_audit_log_actor_user_id'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END;

-- ============================================================================
-- STEP 4: Check index sizes
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  pg_size_pretty(pg_relation_size(indrelid)) as table_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'audit_log', 'transaction_allocations')
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- STEP 5: Check for duplicate indexes
-- ============================================================================

-- Find indexes with similar definitions (potential duplicates)
SELECT 
  tablename,
  array_agg(indexname ORDER BY indexname) as similar_indexes,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'audit_log', 'transaction_allocations')
GROUP BY tablename, 
  -- Normalize index definition for comparison (remove index name)
  regexp_replace(indexdef, 'CREATE (UNIQUE )?INDEX [^ ]+', 'CREATE INDEX', 'g')
HAVING COUNT(*) > 1
ORDER BY count DESC, tablename;

-- ============================================================================
-- STEP 6: Check table statistics
-- ============================================================================

SELECT 
  schemaname,
  relname as tablename,
  seq_scan as sequential_scans,
  seq_tup_read as sequential_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as index_tuples_fetched,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  CASE 
    WHEN seq_scan > idx_scan * 10 THEN '⚠️ TOO MANY SEQ SCANS'
    WHEN idx_scan = 0 AND seq_scan > 0 THEN '⚠️ NO INDEX USAGE'
    ELSE '✅ HEALTHY'
  END as scan_health
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'audit_log', 'transaction_allocations')
ORDER BY seq_scan DESC;
