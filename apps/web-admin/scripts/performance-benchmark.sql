-- ============================================================================
-- Performance Benchmark Queries
-- Date: 2026-01-14
-- Purpose: Run performance benchmarks on critical queries with large datasets
-- ============================================================================

-- Set test institution ID
\set test_institution_id '00000000-0000-0000-0000-000000000001'

-- ============================================================================
-- BENCHMARK 1: Transactions by Institution and Status
-- ============================================================================

\timing on

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status,
  t.payer_phone,
  t.momo_ref
FROM transactions t
WHERE t.institution_id = :'test_institution_id'::uuid
  AND t.allocation_status = 'unallocated'
ORDER BY t.occurred_at DESC
LIMIT 50;

-- ============================================================================
-- BENCHMARK 2: Members with Groups (Paginated)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  m.id,
  m.full_name,
  m.phone,
  m.status,
  COUNT(gm.group_id) as group_count
FROM members m
LEFT JOIN group_members gm ON m.id = gm.member_id
WHERE m.institution_id = :'test_institution_id'::uuid
GROUP BY m.id, m.full_name, m.phone, m.status
ORDER BY m.created_at DESC
LIMIT 50
OFFSET 0;

-- ============================================================================
-- BENCHMARK 3: Groups with Member Counts
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  g.id,
  g.group_name,
  g.institution_id,
  COUNT(gm.member_id) as member_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
WHERE g.institution_id = :'test_institution_id'::uuid
GROUP BY g.id, g.group_name, g.institution_id
ORDER BY g.created_at DESC
LIMIT 50
OFFSET 0;

-- ============================================================================
-- BENCHMARK 4: Transactions Date Range Query
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status
FROM transactions t
WHERE t.institution_id = :'test_institution_id'::uuid
  AND t.occurred_at >= NOW() - interval '30 days'
  AND t.occurred_at <= NOW()
  AND t.allocation_status IN ('unallocated', 'allocated')
ORDER BY t.occurred_at DESC
LIMIT 50;

-- ============================================================================
-- BENCHMARK 5: Search Members
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  m.id,
  m.full_name,
  m.phone,
  m.status
FROM members m
WHERE m.institution_id = :'test_institution_id'::uuid
  AND (m.full_name ILIKE '%Test%' OR m.phone ILIKE '%078%')
ORDER BY m.created_at DESC
LIMIT 50;

-- ============================================================================
-- BENCHMARK 6: Unprocessed SMS Messages
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  device_id,
  sender_phone,
  message_text,
  processed_at
FROM momo_sms_raw
WHERE institution_id = :'test_institution_id'::uuid
  AND processed_at IS NULL
ORDER BY ingested_at DESC
LIMIT 100;

-- ============================================================================
-- BENCHMARK 7: Transaction Allocation (RPC)
-- ============================================================================

-- Note: This requires a real transaction and member ID
-- Replace with actual IDs from your test data
/*
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM allocate_transaction(
  p_transaction_id := 'REPLACE_WITH_ACTUAL_ID'::uuid,
  p_member_id := 'REPLACE_WITH_ACTUAL_ID'::uuid,
  p_note := 'Performance test allocation'
);
*/

-- ============================================================================
-- SUMMARY: Check Index Usage Statistics
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('transactions', 'members', 'groups', 'group_members', 'momo_sms_raw')
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- ============================================================================
-- SUMMARY: Table Statistics
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  seq_scan as sequential_scans,
  seq_tup_read as sequential_tuples_read,
  idx_scan as index_scans,
  idx_tup_fetch as index_tuples_fetched,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('transactions', 'members', 'groups', 'group_members', 'momo_sms_raw')
ORDER BY seq_scan DESC;

\timing off
