# Index Performance Verification Guide

**Date:** 2026-01-14  
**Purpose:** Verify that database indexes are being used correctly for optimal query performance

---

## Overview

This document provides SQL queries to verify that the optimized indexes created in `20260113000000_optimize_indexes.sql` are being used by the database query planner.

---

## Critical Queries to Test

### 1. Transactions by Institution and Allocation Status

**Query:**
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status,
  t.payer_phone,
  t.momo_ref,
  t.payer_name
FROM transactions t
WHERE t.institution_id = 'YOUR_INSTITUTION_ID'::uuid
  AND t.allocation_status = 'unallocated'
ORDER BY t.occurred_at DESC
LIMIT 50;
```

**Expected Result:**
- Should show: `Index Scan using idx_transactions_allocation_status_optimized`
- Should NOT show: `Seq Scan on transactions`
- Execution time should be < 50ms for typical datasets

**Index Used:** `idx_transactions_allocation_status_optimized`

---

### 2. Transactions by Member

**Query:**
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.type,
  t.status
FROM transactions t
WHERE t.member_id = 'YOUR_MEMBER_ID'::uuid
ORDER BY t.occurred_at DESC
LIMIT 100;
```

**Expected Result:**
- Should show: `Index Scan using idx_transactions_member_id`
- Execution time should be < 30ms

**Index Used:** `idx_transactions_member_id`

---

### 3. Transactions Date Range Query

**Query:**
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status
FROM transactions t
WHERE t.institution_id = 'YOUR_INSTITUTION_ID'::uuid
  AND t.occurred_at >= '2026-01-01'::timestamp
  AND t.occurred_at <= '2026-01-31'::timestamp
  AND t.allocation_status IN ('unallocated', 'allocated')
ORDER BY t.occurred_at DESC
LIMIT 50;
```

**Expected Result:**
- Should use composite index with date filtering
- Execution time should be < 100ms

**Index Used:** `idx_transactions_allocation_status_optimized`

---

### 4. Unprocessed SMS Messages

**Query:**
```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id,
  device_id,
  sender_phone,
  message_text,
  processed_at
FROM momo_sms_raw
WHERE institution_id = 'YOUR_INSTITUTION_ID'::uuid
  AND processed_at IS NULL
ORDER BY ingested_at DESC
LIMIT 100;
```

**Expected Result:**
- Should use index on `institution_id` and `processed_at`
- Execution time should be < 50ms

---

## How to Interpret Results

### Good Signs ✅
- `Index Scan using <index_name>` - Index is being used
- `Execution Time: < 100ms` - Fast query execution
- `Buffers: shared hit=X` - Data is in cache (good)
- `Planning Time: < 5ms` - Query planner is fast

### Bad Signs ❌
- `Seq Scan on <table_name>` - Full table scan (index not used)
- `Execution Time: > 1000ms` - Slow query
- `Buffers: shared read=X` - Reading from disk (slower)

### If Index Not Used

1. **Check if index exists:**
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'transactions' 
   AND indexname LIKE 'idx_transactions%';
   ```

2. **Check table statistics:**
   ```sql
   ANALYZE transactions;
   ```

3. **Check query planner settings:**
   ```sql
   SHOW enable_seqscan;  -- Should be 'on' (default)
   SHOW random_page_cost;  -- Should be 4.0 (default for SSD)
   ```

---

## Index Usage Statistics

Run this query to see how often indexes are being used:

```sql
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
  AND tablename IN ('transactions', 'momo_sms_raw', 'members', 'groups')
ORDER BY idx_scan DESC;
```

**Expected:**
- `index_scans` should be > 0 for frequently used indexes
- Indexes with 0 scans may be unused and can be considered for removal

---

## Table Statistics

Check overall table access patterns:

```sql
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
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN ('transactions', 'momo_sms_raw', 'members', 'groups')
ORDER BY seq_scan DESC;
```

**Expected:**
- `index_scans` should be much higher than `sequential_scans`
- If `sequential_scans` is high, indexes may not be optimal

---

## Performance Benchmarks

### Target Performance (with indexes)

| Query Type | Target Execution Time | Max Acceptable |
|------------|----------------------|----------------|
| Transactions by institution + status | < 50ms | < 200ms |
| Transactions by member | < 30ms | < 100ms |
| Transactions date range | < 100ms | < 500ms |
| Unprocessed SMS | < 50ms | < 200ms |
| Members with groups | < 100ms | < 300ms |
| Groups with counts | < 80ms | < 250ms |

---

## Maintenance

### Regular Tasks

1. **Update statistics weekly:**
   ```sql
   ANALYZE transactions;
   ANALYZE momo_sms_raw;
   ANALYZE members;
   ANALYZE groups;
   ```

2. **Monitor index bloat monthly:**
   ```sql
   SELECT 
     schemaname,
     tablename,
     indexname,
     pg_size_pretty(pg_relation_size(indexrelid)) as size,
     idx_scan
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```

3. **Review unused indexes quarterly:**
   - Remove indexes with `idx_scan = 0` for > 3 months
   - Consider partial indexes for frequently filtered columns

---

## Troubleshooting

### Issue: Index not being used

**Possible causes:**
1. Table statistics are stale → Run `ANALYZE table_name;`
2. Query doesn't match index columns → Review query and index definition
3. Index is not selective enough → Consider partial index
4. Query planner chooses seq scan → Check `enable_seqscan` setting

**Solution:**
```sql
-- Force index usage (temporary, for testing)
SET enable_seqscan = off;
EXPLAIN ANALYZE <your_query>;
SET enable_seqscan = on;
```

---

## Related Files

- `supabase/migrations/20260113000000_optimize_indexes.sql` - Index definitions
- `supabase/migrations/20260114000000_verify_index_performance.sql` - Verification queries
- `scripts/verify-index-performance.sh` - Automated verification script

---

## Next Steps

1. Run EXPLAIN ANALYZE on each critical query
2. Document actual execution times
3. Compare against target benchmarks
4. Optimize queries or indexes if needed
5. Re-run verification after optimizations
