# Database Partitioning Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents the database partitioning strategy for IBIMINA GEMINI, which improves query performance and simplifies data management for large tables.

---

## Partitioning Strategy

### Partitioned Tables

1. **transactions** - Partitioned by `created_at` (monthly)
2. **momo_sms_raw** - Partitioned by `received_at` (monthly)

### Partition Type

**Range Partitioning** by month:
- Each partition contains data for one month
- Partitions are created automatically for the next 12 months
- Old partitions can be archived or dropped

---

## Benefits

### Performance

- **Faster queries:** Only relevant partitions are scanned
- **Better index performance:** Smaller indexes per partition
- **Parallel query execution:** Partitions can be queried in parallel

### Maintenance

- **Easier archival:** Drop old partitions instead of deleting rows
- **Reduced maintenance overhead:** Smaller tables are easier to maintain
- **Better backup strategy:** Backup only active partitions

### Scalability

- **Handles growth:** System scales as data grows
- **Predictable performance:** Query performance remains consistent

---

## Partition Management

### Creating Partitions

Partitions are created automatically, but you can manually create them:

```sql
-- Create partition for a specific month
SELECT create_monthly_partition('transactions', '2026-02-01');

-- Ensure partitions exist for next 3 months
SELECT ensure_partitions_exist('transactions', 3);
```

### Viewing Partition Information

```sql
-- Get information about all partitions
SELECT * FROM get_partition_info('transactions');
SELECT * FROM get_partition_info('momo_sms_raw');
```

### Archiving Old Partitions

```sql
-- Drop partitions older than 12 months
SELECT drop_old_partition('transactions', 12);
SELECT drop_old_partition('momo_sms_raw', 12);
```

---

## Automated Maintenance

### Scheduled Partition Creation

Set up a cron job or scheduled task to ensure partitions exist:

```sql
-- Run monthly to create next month's partition
SELECT ensure_partitions_exist('transactions', 3);
SELECT ensure_partitions_exist('momo_sms_raw', 3);
```

### Recommended Schedule

- **Weekly:** Ensure partitions exist for next 3 months
- **Monthly:** Create next month's partition
- **Quarterly:** Archive partitions older than retention period

---

## Query Optimization

### Date Range Queries

Partitioning automatically optimizes date range queries:

```sql
-- This query only scans relevant partitions
SELECT * FROM transactions
WHERE created_at >= '2026-01-01'
  AND created_at < '2026-02-01';
```

### Best Practices

1. **Always include date filters** in WHERE clauses
2. **Use date ranges** instead of individual dates when possible
3. **Avoid full table scans** by always filtering by partition key

---

## Migration Process

### Pre-Migration Checklist

- [ ] Backup database
- [ ] Test on staging environment
- [ ] Verify table structures
- [ ] Check data integrity

### Migration Steps

1. Run migration script: `20260115000008_database_partitioning.sql`
2. Verify partitions created
3. Test queries
4. Monitor performance

### Rollback

If issues occur:

```sql
-- Rename tables back
ALTER TABLE transactions RENAME TO transactions_partitioned;
ALTER TABLE transactions_old RENAME TO transactions;

ALTER TABLE momo_sms_raw RENAME TO momo_sms_raw_partitioned;
ALTER TABLE momo_sms_raw_old RENAME TO momo_sms_raw;
```

---

## Monitoring

### Check Partition Sizes

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'transactions_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Partition Usage

```sql
-- View partition statistics
SELECT * FROM get_partition_info('transactions');
```

### Query Performance

Monitor query execution plans to ensure partition pruning:

```sql
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE created_at >= '2026-01-01'
  AND created_at < '2026-02-01';
```

Look for "Partition Pruning" in the execution plan.

---

## Best Practices

### Do's

✅ Always filter by partition key (date)  
✅ Create partitions in advance  
✅ Monitor partition sizes  
✅ Archive old partitions regularly  
✅ Test queries with EXPLAIN ANALYZE  

### Don'ts

❌ Don't query without date filters  
❌ Don't let partitions grow indefinitely  
❌ Don't drop partitions without backup  
❌ Don't create too many partitions at once  

---

## Troubleshooting

### Partition Not Created

If a partition doesn't exist for a date range:

```sql
-- Manually create the partition
SELECT create_monthly_partition('transactions', '2026-02-01');
```

### Query Performance Issues

1. Check if partition pruning is working:
   ```sql
   EXPLAIN ANALYZE <your_query>;
   ```

2. Verify indexes exist on partitions:
   ```sql
   \d+ transactions_2026_01
   ```

3. Check partition statistics:
   ```sql
   ANALYZE transactions_2026_01;
   ```

---

## Resources

- **Migration Script:** `supabase/migrations/20260115000008_database_partitioning.sql`
- **PostgreSQL Partitioning Docs:** https://www.postgresql.org/docs/current/ddl-partitioning.html

---

**Document Owner:** Backend Team  
**Last Updated:** January 2026
