# Report Generation Performance Testing Guide

**Date:** 2026-01-14  
**Purpose:** Test report generation performance with large date ranges and datasets

---

## Overview

This document provides a comprehensive guide for testing the application's report generation performance with various date ranges and large datasets. The goal is to ensure reports generate efficiently and within acceptable time limits.

---

## Report Generation System

### Components

1. **Reports.tsx** - Main reports page component
2. **ReportFilters.tsx** - Date range and scope filters
3. **ReportKPIs.tsx** - Key performance indicators display
4. **ReportLedgerTable.tsx** - Transaction ledger with pagination
5. **CsvExport.tsx** - CSV export functionality

### API Functions

1. **get_report_summary** - RPC function for report summary/KPIs
2. **get_report_ledger** - RPC function for transaction ledger
3. **get_member_contributions_summary** - RPC function for member contributions
4. **get_group_contributions_summary** - RPC function for group contributions
5. **generateGroupReport** - Edge function for PDF report generation

---

## Test Scenarios

### Scenario 1: Weekly Report (7 days)

**Date Range:** Last 7 days  
**Expected Data:** 1000+ transactions  
**Target Time:** < 3 seconds  
**Max Acceptable:** < 5 seconds

**Test Steps:**
1. Navigate to Reports page
2. Select a group or institution
3. Set date range to last 7 days
4. Click "Generate Report"
5. Measure time from click to report display

**Expected Results:**
- Report loads within 3 seconds
- Summary KPIs display correctly
- Ledger shows first 50 transactions
- No UI freezing

---

### Scenario 2: Monthly Report (30 days)

**Date Range:** Last 30 days  
**Expected Data:** 5000+ transactions  
**Target Time:** < 5 seconds  
**Max Acceptable:** < 10 seconds

**Test Steps:**
1. Navigate to Reports page
2. Select a group or institution
3. Set date range to last 30 days
4. Click "Generate Report"
5. Measure time from click to report display

**Expected Results:**
- Report loads within 5 seconds
- Summary KPIs display correctly
- Ledger pagination works smoothly
- No performance degradation

---

### Scenario 3: Quarterly Report (90 days)

**Date Range:** Last 90 days  
**Expected Data:** 15000+ transactions  
**Target Time:** < 10 seconds  
**Max Acceptable:** < 20 seconds

**Test Steps:**
1. Navigate to Reports page
2. Select a group or institution
3. Set date range to last 90 days
4. Click "Generate Report"
5. Measure time from click to report display

**Expected Results:**
- Report loads within 10 seconds
- Summary KPIs display correctly
- Ledger pagination works smoothly
- No memory issues

---

### Scenario 4: Yearly Report (365 days)

**Date Range:** Last 365 days  
**Expected Data:** 50000+ transactions  
**Target Time:** < 15 seconds  
**Max Acceptable:** < 30 seconds

**Test Steps:**
1. Navigate to Reports page
2. Select a group or institution
3. Set date range to last 365 days
4. Click "Generate Report"
5. Measure time from click to report display

**Expected Results:**
- Report loads within 15 seconds
- Summary KPIs display correctly
- Ledger pagination works smoothly
- No timeout errors

---

### Scenario 5: Overall Report (All time)

**Date Range:** All time  
**Expected Data:** 100000+ transactions  
**Target Time:** < 20 seconds  
**Max Acceptable:** < 40 seconds

**Test Steps:**
1. Navigate to Reports page
2. Select a group or institution
3. Set date range to all time (or very large range)
4. Click "Generate Report"
5. Measure time from click to report display

**Expected Results:**
- Report loads within 20 seconds
- Summary KPIs display correctly
- Ledger pagination works smoothly
- No timeout errors

---

## Performance Benchmarks

### Target Performance Times

| Report Type | Date Range | Target Time | Max Acceptable | Critical |
|-------------|------------|------------|----------------|----------|
| Weekly | 7 days | < 3s | < 5s | > 10s |
| Monthly | 30 days | < 5s | < 10s | > 20s |
| Quarterly | 90 days | < 10s | < 20s | > 40s |
| Yearly | 365 days | < 15s | < 30s | > 60s |
| Overall | All time | < 20s | < 40s | > 80s |

### Query Performance Targets

| Query Type | Target Time | Max Acceptable |
|------------|-------------|----------------|
| get_report_summary | < 2s | < 5s |
| get_report_ledger (first page) | < 1s | < 3s |
| get_member_contributions_summary | < 500ms | < 2s |
| get_group_contributions_summary | < 1s | < 3s |

---

## Manual Testing Guide

### Test 1: Report Generation Time

**Purpose:** Measure actual report generation time

**Steps:**
1. Open browser DevTools → Network tab
2. Navigate to Reports page
3. Select scope (group/institution)
4. Set date range
5. Click "Generate Report"
6. Note the time from request start to response end

**Expected:**
- Time within target for date range
- No failed requests
- Proper loading indicators

---

### Test 2: Database Query Performance

**Purpose:** Verify database queries are optimized

**Steps:**
1. Open Supabase SQL Editor
2. Run queries from `scripts/report-query-benchmarks.sql`
3. Replace placeholders with actual IDs
4. Check EXPLAIN ANALYZE output

**Expected:**
- Queries use indexes (Index Scan, not Seq Scan)
- Execution time within targets
- Buffer hit ratio > 90%

---

### Test 3: UI Responsiveness

**Purpose:** Verify UI doesn't freeze during report generation

**Steps:**
1. Open DevTools → Performance tab
2. Start recording
3. Generate report
4. Stop recording
5. Check for long tasks

**Expected:**
- No long tasks (> 50ms)
- UI remains responsive
- Loading indicators show progress

---

### Test 4: Memory Usage

**Purpose:** Verify no memory leaks during report generation

**Steps:**
1. Open DevTools → Memory tab
2. Take heap snapshot (before)
3. Generate multiple reports
4. Take heap snapshot (after)
5. Compare snapshots

**Expected:**
- Memory usage stable
- No significant growth
- No memory leaks

---

### Test 5: CSV Export Performance

**Purpose:** Verify CSV export works with large datasets

**Steps:**
1. Generate report with large date range
2. Click "Export CSV"
3. Measure time to download
4. Verify CSV contains all data

**Expected:**
- CSV exports within reasonable time
- All data included
- File size reasonable

---

## Browser DevTools Testing

### Network Tab

1. **Open DevTools → Network**
2. **Filter by XHR/Fetch**
3. **Generate report**
4. **Check for:**
   - Request times within targets
   - No failed requests
   - Proper response sizes
   - Request deduplication

### Performance Tab

1. **Open DevTools → Performance**
2. **Start recording**
3. **Generate report**
4. **Stop recording**
5. **Check for:**
   - No long tasks
   - Efficient JavaScript execution
   - Smooth UI updates

### Console Tab

1. **Open DevTools → Console**
2. **Check for:**
   - No errors
   - No warnings
   - Performance logs (if enabled)

---

## Database Query Optimization

### Indexes for Report Queries

Reports rely on indexes for efficient querying:

1. **Transactions by date range:**
   - `idx_transactions_allocation_status_optimized`
   - `idx_transactions_institution_date`

2. **Transactions by group:**
   - `idx_transactions_group_id`
   - `idx_transactions_member_id`

3. **Transactions by status:**
   - `idx_transactions_allocation_status_optimized`

### Query Optimization Tips

1. **Use date range filters:**
   - Always filter by date range
   - Use indexes on date columns

2. **Limit result sets:**
   - Use pagination for large datasets
   - Limit initial load to 50 items

3. **Avoid N+1 queries:**
   - Use JOINs instead of multiple queries
   - Batch related queries

4. **Use RPC functions:**
   - Pre-optimized database functions
   - Better query planning

---

## Common Issues and Solutions

### Issue: Slow Report Generation

**Symptoms:**
- Reports take > 30 seconds
- UI freezes during generation
- Timeout errors

**Solutions:**
1. Check database indexes
2. Verify date range filters use indexes
3. Optimize RPC functions
4. Add pagination for large datasets
5. Consider caching for frequently accessed reports

---

### Issue: Timeout Errors

**Symptoms:**
- Reports fail with timeout
- Network requests timeout
- Database queries timeout

**Solutions:**
1. Increase timeout limits
2. Optimize slow queries
3. Add pagination
4. Consider background job processing
5. Use streaming for large datasets

---

### Issue: Memory Issues

**Symptoms:**
- Browser becomes slow
- Memory usage grows
- Crashes with large datasets

**Solutions:**
1. Implement pagination
2. Use virtualization for large lists
3. Limit data loaded at once
4. Clear unused data from memory
5. Use streaming for large exports

---

### Issue: Incorrect Data

**Symptoms:**
- Reports show wrong totals
- Missing transactions
- Duplicate entries

**Solutions:**
1. Verify date range filters
2. Check RPC function logic
3. Verify data integrity
4. Check for timezone issues
5. Validate aggregation logic

---

## Automated Testing

### Run Performance Test Script

```bash
chmod +x scripts/test-report-generation-performance.sh
./scripts/test-report-generation-performance.sh
```

### Run Query Benchmarks

1. Open Supabase SQL Editor
2. Run `scripts/report-query-benchmarks.sql`
3. Replace placeholders with actual IDs
4. Review EXPLAIN ANALYZE output

---

## Success Criteria

✅ **All tests pass if:**
1. Reports generate within target times
2. Database queries use indexes
3. UI remains responsive
4. No memory leaks
5. CSV export works correctly
6. No timeout errors
7. Data accuracy is maintained

---

## Related Files

- `components/Reports.tsx` - Main reports component
- `components/reports/ReportLedgerTable.tsx` - Ledger table with pagination
- `lib/api/reports.api.ts` - Report API functions
- `scripts/report-query-benchmarks.sql` - Query performance benchmarks
- `scripts/test-report-generation-performance.sh` - Testing script
- `docs/performance/REPORT_GENERATION_TEST_RESULTS.md` - Test results template

---

## Next Steps

After completing testing:
1. Document any performance issues found
2. Optimize slow queries
3. Fix memory leaks if found
4. Re-test after optimizations
5. Update performance benchmarks
