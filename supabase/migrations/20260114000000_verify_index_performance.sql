-- ============================================================================
-- Verify Index Performance with EXPLAIN ANALYZE
-- Date: 2026-01-14
-- Purpose: Run EXPLAIN ANALYZE on critical queries to verify indexes are used
-- ============================================================================

-- ============================================================================
-- CRITICAL QUERY 1: Transactions by institution and allocation status
-- This is the most common query pattern
-- ============================================================================

-- Query: Get unallocated transactions for an institution
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status,
  t.payer_phone,
  t.momo_ref,
  t.payer_name,
  m.full_name as member_name,
  g.name as group_name
FROM transactions t
LEFT JOIN members m ON t.member_id = m.id
LEFT JOIN groups g ON t.group_id = g.id
WHERE t.institution_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND t.allocation_status = 'unallocated'
ORDER BY t.occurred_at DESC
LIMIT 50;

-- Expected: Should use idx_transactions_allocation_status_optimized
-- Check for: Index Scan using idx_transactions_allocation_status_optimized

-- ============================================================================
-- CRITICAL QUERY 2: Transactions by member
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.type,
  t.status,
  t.allocation_status
FROM transactions t
WHERE t.member_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY t.occurred_at DESC
LIMIT 100;

-- Expected: Should use idx_transactions_member_id
-- Check for: Index Scan using idx_transactions_member_id

-- ============================================================================
-- CRITICAL QUERY 3: Transactions date range with filters
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status,
  t.payer_phone,
  t.momo_ref
FROM transactions t
WHERE t.institution_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND t.occurred_at >= '2026-01-01'::timestamp
  AND t.occurred_at <= '2026-01-31'::timestamp
  AND t.allocation_status IN ('unallocated', 'allocated')
ORDER BY t.occurred_at DESC
LIMIT 50;

-- Expected: Should use idx_transactions_allocation_status_optimized
-- Check for: Index Scan with proper date filtering

-- ============================================================================
-- CRITICAL QUERY 4: SMS messages by institution and processed status
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  device_id,
  sender_phone,
  message_text,
  processed_at,
  parsed_at
FROM momo_sms_raw
WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND processed_at IS NULL
ORDER BY ingested_at DESC
LIMIT 100;

-- Expected: Should use index on institution_id and processed_at
-- Check for: Index Scan with NULL filter

-- ============================================================================
-- CRITICAL QUERY 5: Members with groups (common join)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  m.id,
  m.full_name,
  m.phone_number,
  m.status,
  COUNT(gm.group_id) as group_count
FROM members m
LEFT JOIN group_members gm ON m.id = gm.member_id
WHERE m.institution_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY m.id, m.full_name, m.phone_number, m.status
ORDER BY m.full_name
LIMIT 100;

-- Expected: Should use index on members.institution_id and group_members.member_id
-- Check for: Index Scan on both tables

-- ============================================================================
-- CRITICAL QUERY 6: Groups with member counts
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  g.id,
  g.name,
  g.institution_id,
  COUNT(gm.member_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.institution_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY g.id, g.name, g.institution_id
ORDER BY g.name
LIMIT 100;

-- Expected: Should use index on groups.institution_id and group_members.group_id
-- Check for: Index Scan on both tables

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to check index usage statistics
-- ============================================================================

-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'group_members')
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as sequential_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as index_tuples_fetched,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'group_members')
ORDER BY seq_scan DESC;

-- Check index sizes
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups', 'group_members')
ORDER BY pg_relation_size(indexrelid) DESC;
