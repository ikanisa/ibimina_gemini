# Database Indexing Recommendations

This document outlines recommended database indexes for optimal query performance in Ibimina.

## Core Tables

### transactions

The `transactions` table is heavily queried with various filters.

```sql
-- Primary filter: institution + date range + status (most common dashboard/list queries)
CREATE INDEX IF NOT EXISTS idx_transactions_institution_occurred_status 
ON transactions (institution_id, occurred_at DESC, status);

-- Allocation queries (unallocated queue)
CREATE INDEX IF NOT EXISTS idx_transactions_institution_allocation 
ON transactions (institution_id, allocation_status) 
WHERE allocation_status = 'unallocated';

-- Member transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_member_occurred 
ON transactions (member_id, occurred_at DESC) 
WHERE member_id IS NOT NULL;

-- Group transaction history
CREATE INDEX IF NOT EXISTS idx_transactions_group_occurred 
ON transactions (group_id, occurred_at DESC) 
WHERE group_id IS NOT NULL;

-- Phone/reference search (text search)
CREATE INDEX IF NOT EXISTS idx_transactions_payer_phone 
ON transactions (institution_id, payer_phone) 
WHERE payer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_momo_ref 
ON transactions (institution_id, momo_ref) 
WHERE momo_ref IS NOT NULL;
```

### members

```sql
-- List by institution + group
CREATE INDEX IF NOT EXISTS idx_members_institution_group 
ON members (institution_id, group_id);

-- Search by name (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_members_full_name_lower 
ON members (institution_id, LOWER(full_name));

-- Search by phone
CREATE INDEX IF NOT EXISTS idx_members_phone 
ON members (institution_id, phone) 
WHERE phone IS NOT NULL;

-- Search by member code
CREATE INDEX IF NOT EXISTS idx_members_code 
ON members (institution_id, member_code) 
WHERE member_code IS NOT NULL;
```

### groups

```sql
-- List by institution + status
CREATE INDEX IF NOT EXISTS idx_groups_institution_status 
ON groups (institution_id, status);

-- Search by name
CREATE INDEX IF NOT EXISTS idx_groups_institution_name 
ON groups (institution_id, LOWER(name));
```

### contributions

```sql
-- Member contribution history
CREATE INDEX IF NOT EXISTS idx_contributions_member 
ON contributions (member_id, recorded_at DESC);

-- Group contribution totals
CREATE INDEX IF NOT EXISTS idx_contributions_group 
ON contributions (group_id, recorded_at DESC);
```

### profiles

```sql
-- Lookup by user_id (should exist from Supabase Auth)
-- This is typically handled by Supabase

-- Institution staff lookup
CREATE INDEX IF NOT EXISTS idx_profiles_institution_role 
ON profiles (institution_id, role) 
WHERE institution_id IS NOT NULL;
```

## Applying Indexes

### Via Supabase Dashboard

1. Go to **SQL Editor** in your Supabase project
2. Paste the relevant CREATE INDEX statements
3. Run the query

### Via Migration

Create a new migration file:

```bash
# Using Supabase CLI
supabase migration new add_performance_indexes
```

Then add the indexes to the generated migration file.

## Index Verification

Check existing indexes:

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Check index usage:

```sql
SELECT 
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

## Performance Notes

1. **Partial indexes** (with WHERE clauses) are used where possible to reduce index size
2. **Composite indexes** are ordered by selectivity (most selective first)
3. **DESC ordering** is specified for time-based queries that typically want newest first
4. **LOWER()** function indexes support case-insensitive search

## When to Add More Indexes

Monitor slow queries using Supabase Logs or PostgreSQL explain plans:

```sql
EXPLAIN ANALYZE
SELECT * FROM transactions 
WHERE institution_id = 'xxx' 
  AND occurred_at > '2024-01-01'
ORDER BY occurred_at DESC
LIMIT 50;
```

If you see sequential scans on large tables, consider adding targeted indexes.
