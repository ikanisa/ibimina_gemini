# Large Dataset Performance Testing Guide

**Date:** 2026-01-14  
**Purpose:** Test application performance with 1000+ records to ensure scalability

---

## Overview

This document provides a comprehensive guide for testing the application's performance with large datasets. The goal is to verify that the application can handle production-scale data volumes efficiently.

---

## Test Data Generation

### Prerequisites

1. **Supabase Project Linked:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Test Environment:**
   - Use a development or staging environment
   - **DO NOT** run on production database

### Generate Test Data

**Option 1: Using the seed script**
```bash
chmod +x scripts/test-large-dataset-performance.sh
./scripts/test-large-dataset-performance.sh
```

**Option 2: Manual execution**
1. Open Supabase SQL Editor
2. Run: `supabase/seed/014_large_dataset_performance_test.sql`
3. Verify data was created

### Generated Data Volumes

| Table | Count | Purpose |
|-------|-------|---------|
| Groups | 1000+ | Test groups list pagination |
| Members | 1000+ | Test members list pagination |
| Transactions | 10000+ | Test transactions virtualization |
| Group Memberships | 5000+ | Test group-member relationships |
| SMS Messages | 5000+ | Test SMS gateway performance |

**Test Institution ID:** `00000000-0000-0000-0000-000000000001`  
**Test Institution Code:** `PERF_TEST`

---

## Performance Test Scenarios

### 1. Groups Page Performance

**Test Steps:**
1. Navigate to Groups page
2. Verify initial load time
3. Test pagination (load more)
4. Test search functionality
5. Test filtering

**Expected Results:**
- Initial load: < 2 seconds
- Pagination: Smooth, no lag
- Search: Results appear within 500ms
- Filtering: No performance degradation

**Metrics to Check:**
- Network requests: Should be deduplicated
- Query execution time: < 200ms per page
- Memory usage: Stable, no leaks
- Scroll performance: 60fps

---

### 2. Members Page Performance

**Test Steps:**
1. Navigate to Members page
2. Verify initial load (first 50 members)
3. Test infinite scroll
4. Test search by name/phone
5. Test member detail view

**Expected Results:**
- Initial load: < 1.5 seconds
- Infinite scroll: Smooth loading, no duplicates
- Search: Fast response (< 300ms)
- Detail view: Instant load

**Metrics to Check:**
- Virtualization: Only visible items rendered
- API calls: Properly paginated
- Memory: No accumulation of rendered items

---

### 3. Transactions Page Performance

**Test Steps:**
1. Navigate to Transactions page
2. Verify initial load (first 50 transactions)
3. Test infinite scroll with virtualization
4. Test filtering by status
5. Test date range filtering
6. Test search functionality

**Expected Results:**
- Initial load: < 2 seconds
- Virtualization: Smooth scrolling, 60fps
- Filtering: Fast query execution (< 500ms)
- Search: Responsive (< 400ms)

**Metrics to Check:**
- Virtual list: Only visible rows rendered
- Query performance: Uses indexes (check EXPLAIN ANALYZE)
- Memory usage: Constant, not growing
- Network: Requests deduplicated

---

### 4. SMS Gateway Page Performance

**Test Steps:**
1. Navigate to SMS Gateway Devices page
2. Verify device list loads quickly
3. Test SMS messages list (5000+ messages)
4. Test filtering by status
5. Test search functionality

**Expected Results:**
- Device list: < 1 second
- Messages list: Paginated, < 2 seconds per page
- Filtering: Fast (< 300ms)
- Search: Responsive (< 400ms)

---

### 5. Reports Generation Performance

**Test Steps:**
1. Navigate to Reports page
2. Generate weekly report for a group
3. Generate monthly report
4. Generate overall report
5. Test with large date ranges

**Expected Results:**
- Weekly report: < 3 seconds
- Monthly report: < 5 seconds
- Overall report: < 10 seconds
- Large date range: < 15 seconds

**Metrics to Check:**
- Query execution: Uses indexes
- Data aggregation: Efficient
- PDF generation: Reasonable time

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| Initial Page Load | < 2s | < 3s | > 5s |
| Query Execution | < 200ms | < 500ms | > 1000ms |
| Search Response | < 300ms | < 500ms | > 1000ms |
| Pagination Load | < 500ms | < 1000ms | > 2000ms |
| Scroll FPS | 60fps | 30fps | < 30fps |
| Memory Usage | Stable | < 100MB growth | Growing |

---

## Query Performance Verification

### Run EXPLAIN ANALYZE

For each critical query, run EXPLAIN ANALYZE to verify index usage:

```sql
-- Example: Transactions query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  t.id,
  t.occurred_at,
  t.amount,
  t.allocation_status
FROM transactions t
WHERE t.institution_id = '00000000-0000-0000-0000-000000000001'::uuid
  AND t.allocation_status = 'unallocated'
ORDER BY t.occurred_at DESC
LIMIT 50;
```

**Check for:**
- `Index Scan` (good) vs `Seq Scan` (bad)
- Execution time < 200ms
- Buffers: `shared hit` (cached) preferred

---

## Browser DevTools Testing

### Network Tab

1. **Open DevTools → Network**
2. **Filter by XHR/Fetch**
3. **Navigate to each page**
4. **Verify:**
   - Requests are deduplicated (same request not sent twice)
   - Response times are acceptable
   - No failed requests
   - Proper pagination (limit/offset)

### Performance Tab

1. **Open DevTools → Performance**
2. **Start recording**
3. **Navigate and interact with pages**
4. **Stop recording**
5. **Verify:**
   - No long tasks (> 50ms)
   - Smooth frame rendering
   - No memory leaks
   - Efficient React renders

### Console Tab

1. **Open DevTools → Console**
2. **Check for:**
   - No errors
   - No warnings about performance
   - Web Vitals logs (if enabled)

---

## Virtualization Verification

### Check Virtual List Implementation

1. **Open React DevTools**
2. **Inspect virtualized lists:**
   - Transactions list
   - Members list
   - Groups list
3. **Verify:**
   - Only visible items are rendered
   - DOM nodes don't grow with scroll
   - Scroll performance is smooth

### Manual Test

1. **Open Transactions page**
2. **Scroll to bottom**
3. **Check DOM element count:**
   ```javascript
   // In browser console
   document.querySelectorAll('[data-virtual-item]').length
   ```
4. **Should be ~50-100 items, not 10000+**

---

## Common Issues and Solutions

### Issue: Slow Initial Load

**Symptoms:**
- Page takes > 5 seconds to load
- Network tab shows slow queries

**Solutions:**
1. Check query execution time (EXPLAIN ANALYZE)
2. Verify indexes are being used
3. Check for N+1 queries
4. Verify pagination is working

### Issue: Slow Pagination

**Symptoms:**
- "Load more" takes > 2 seconds
- UI freezes during load

**Solutions:**
1. Verify infinite scroll is using virtualization
2. Check query performance
3. Verify request deduplication
4. Check for memory leaks

### Issue: Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Browser becomes slow after extended use

**Solutions:**
1. Check React component cleanup
2. Verify event listeners are removed
3. Check for closures holding references
4. Use React DevTools Profiler

### Issue: Poor Scroll Performance

**Symptoms:**
- Scrolling is janky
- FPS drops below 30

**Solutions:**
1. Verify virtualization is active
2. Check for expensive re-renders
3. Use React.memo for list items
4. Optimize CSS (avoid complex selectors)

---

## Performance Monitoring

### Web Vitals

Check Core Web Vitals in production:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Database Performance

Monitor query performance:
```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## Cleanup

### Remove Test Data

After testing, clean up test data:

```sql
-- WARNING: This deletes all test data
DELETE FROM transactions WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM group_members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM momo_sms_raw WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM members WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM groups WHERE institution_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM institutions WHERE code = 'PERF_TEST';
```

---

## Success Criteria

✅ **All tests pass if:**
1. Initial page loads < 2 seconds
2. Pagination works smoothly
3. Virtualization prevents DOM bloat
4. Search is responsive (< 500ms)
5. No memory leaks detected
6. Scroll performance is 60fps
7. Queries use indexes (verified with EXPLAIN ANALYZE)
8. Requests are properly deduplicated

---

## Related Files

- `supabase/seed/014_large_dataset_performance_test.sql` - Test data generation
- `scripts/test-large-dataset-performance.sh` - Automated testing script
- `docs/database/INDEX_PERFORMANCE_VERIFICATION.md` - Index performance guide
- `docs/PERFORMANCE_OPTIMIZATION.md` - General performance guide

---

## Next Steps

After completing large dataset testing:
1. Document any performance issues found
2. Optimize slow queries
3. Fix memory leaks if found
4. Re-test after optimizations
5. Update performance benchmarks
