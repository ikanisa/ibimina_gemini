-- ============================================================================
-- Report Generation Query Performance Benchmarks
-- Date: 2026-01-14
-- Purpose: Test report generation queries with large date ranges
-- ============================================================================

-- IMPORTANT: Replace placeholders with actual IDs from your database
-- Get IDs:
-- SELECT id FROM institutions LIMIT 1;
-- SELECT id FROM groups LIMIT 1;
-- SELECT id FROM members LIMIT 1;

\timing on

-- ============================================================================
-- BENCHMARK 1: Weekly Report Summary (7 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_summary(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '7 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL
);

-- ============================================================================
-- BENCHMARK 2: Monthly Report Summary (30 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_summary(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '30 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL
);

-- ============================================================================
-- BENCHMARK 3: Quarterly Report Summary (90 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_summary(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '90 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL
);

-- ============================================================================
-- BENCHMARK 4: Yearly Report Summary (365 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_summary(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '365 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL
);

-- ============================================================================
-- BENCHMARK 5: Overall Report Summary (All time)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_summary(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := '2020-01-01'::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL
);

-- ============================================================================
-- BENCHMARK 6: Weekly Report Ledger (7 days, first page)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_ledger(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '7 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL,
  p_limit := 50,
  p_offset := 0
);

-- ============================================================================
-- BENCHMARK 7: Monthly Report Ledger (30 days, first page)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_ledger(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '30 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL,
  p_limit := 50,
  p_offset := 0
);

-- ============================================================================
-- BENCHMARK 8: Quarterly Report Ledger (90 days, first page)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_report_ledger(
  p_scope := 'group',
  p_scope_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_from := (NOW() - interval '90 days')::timestamp,
  p_to := NOW()::timestamp,
  p_status := NULL,
  p_limit := 50,
  p_offset := 0
);

-- ============================================================================
-- BENCHMARK 9: Member Contributions Summary (30 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_member_contributions_summary(
  p_member_id := 'YOUR_MEMBER_ID_HERE'::uuid,
  p_group_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_period_start := (NOW() - interval '30 days')::text,
  p_period_end := NOW()::text
);

-- ============================================================================
-- BENCHMARK 10: Group Contributions Summary (30 days)
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM get_group_contributions_summary(
  p_group_id := 'YOUR_GROUP_ID_HERE'::uuid,
  p_period_start := (NOW() - interval '30 days')::text,
  p_period_end := NOW()::text
);

-- ============================================================================
-- SUMMARY: Check Index Usage for Report Queries
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'transactions'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- ============================================================================
-- SUMMARY: Check Query Performance Statistics
-- ============================================================================

SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%get_report%'
   OR query LIKE '%get_member_contributions%'
   OR query LIKE '%get_group_contributions%'
ORDER BY mean_exec_time DESC
LIMIT 10;

\timing off
