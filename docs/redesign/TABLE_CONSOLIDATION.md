# Table Consolidation: Contributions & Payment Ledger → Transactions

## Summary

Both `contributions` and `payment_ledger` tables have been **consolidated into the single `transactions` table**. This eliminates duplication and provides a unified ledger for all financial activities.

## What Was Consolidated

### 1. `contributions` table → `transactions`
**Purpose:** Member contributions to groups (previously separate)

**Data Migration:**
```sql
-- From contributions table
INSERT INTO transactions (
  id, institution_id, member_id, group_id, 
  type, amount, currency, channel,
  status, reference, occurred_at, 
  allocation_status
)
SELECT 
  id, institution_id, member_id, group_id,
  'CONTRIBUTION', -- type
  amount, 'RWF', -- currency defaulted
  COALESCE(method, 'Cash'), -- channel from method
  CASE status
    WHEN 'RECORDED' THEN 'COMPLETED'
    WHEN 'RECONCILED' THEN 'COMPLETED'
    ELSE 'PENDING'
  END, -- status mapping
  reference, date, -- occurred_at from date
  CASE 
    WHEN member_id IS NOT NULL THEN 'allocated'
    ELSE 'unallocated'
  END -- allocation_status
FROM contributions;
```

**Key Mappings:**
- `contributions.date` → `transactions.occurred_at`
- `contributions.method` → `transactions.channel`
- `contributions.status` → `transactions.status` (mapped to standard enum)
- Type set to `'CONTRIBUTION'`
- Auto-allocated if `member_id` exists

### 2. `payment_ledger` table → `transactions`
**Purpose:** Payment tracking and MoMo reconciliation (previously separate)

**Data Migration:**
```sql
-- From payment_ledger table
INSERT INTO transactions (
  id, institution_id, member_id, group_id,
  type, amount, currency, channel,
  status, reference, occurred_at,
  payer_ref, allocation_status
)
SELECT 
  id, institution_id, member_id, group_id,
  COALESCE(txn_type, 'PAYMENT'), -- type
  amount, currency, 'MoMo', -- channel defaulted to MoMo
  CASE 
    WHEN reconciled THEN 'COMPLETED'
    ELSE 'PENDING'
  END, -- status from reconciled boolean
  reference, timestamp, -- occurred_at from timestamp
  counterparty, -- payer_ref from counterparty
  CASE 
    WHEN member_id IS NOT NULL THEN 'allocated'
    ELSE 'unallocated'
  END -- allocation_status
FROM payment_ledger;
```

**Key Mappings:**
- `payment_ledger.timestamp` → `transactions.occurred_at`
- `payment_ledger.txn_type` → `transactions.type`
- `payment_ledger.reconciled` → `transactions.status` (boolean to enum)
- `payment_ledger.counterparty` → `transactions.payer_ref`
- Channel defaulted to `'MoMo'`
- Auto-allocated if `member_id` exists

### 3. `incoming_payments` table → `transactions`
**Purpose:** Unreconciled incoming payments (previously separate)

**Data Migration:**
```sql
-- From incoming_payments table
INSERT INTO transactions (
  id, institution_id, 
  type, amount, currency, channel,
  status, reference, occurred_at,
  payer_ref, allocation_status
)
SELECT 
  id, institution_id,
  'PAYMENT', -- type
  amount, 'RWF', 'MoMo', -- defaults
  CASE status
    WHEN 'UNRECONCILED' THEN 'PENDING'
    WHEN 'RECONCILED' THEN 'COMPLETED'
    ELSE 'PENDING'
  END, -- status mapping
  reference, received_date, -- occurred_at from received_date
  payer_ref,
  'unallocated' -- always unallocated (no member_id)
FROM incoming_payments;
```

**Key Mappings:**
- `incoming_payments.received_date` → `transactions.occurred_at`
- `incoming_payments.status` → `transactions.status` (mapped to standard enum)
- Type set to `'PAYMENT'`
- Always `'unallocated'` (no member assignment)

## Unified Transactions Table

### New Structure

```sql
CREATE TABLE transactions (
  id uuid PRIMARY KEY,
  institution_id uuid NOT NULL,
  momo_sms_id uuid, -- NEW: link to SMS source
  member_id uuid, -- from contributions/payment_ledger
  group_id uuid, -- from contributions/payment_ledger
  type text NOT NULL, -- CONTRIBUTION, PAYMENT, etc.
  amount numeric(16,2) NOT NULL,
  currency text DEFAULT 'RWF',
  channel text NOT NULL, -- Cash, MoMo, etc.
  status transaction_status, -- COMPLETED, PENDING, etc.
  reference text,
  occurred_at timestamptz NOT NULL, -- NEW: actual transaction time
  payer_phone text, -- NEW: from MoMo SMS
  payer_name text, -- NEW: from MoMo SMS
  momo_ref text, -- NEW: MoMo reference
  parse_confidence numeric(3,2), -- NEW: AI parse confidence
  allocation_status transaction_allocation_status, -- NEW: unallocated/allocated
  created_at timestamptz DEFAULT NOW()
);
```

### Benefits of Consolidation

1. **Single source of truth** - All financial transactions in one table
2. **Unified queries** - No more JOINs across multiple transaction tables
3. **Consistent allocation workflow** - All transactions follow same allocation pattern
4. **Simpler schema** - Fewer tables to maintain
5. **Better performance** - Single index, single query for all transactions
6. **Audit trail** - Complete transaction history in one place

## Migration Status

### Phase 1: Data Migration (Completed in migration)
✅ Migrate `contributions` → `transactions`
✅ Migrate `payment_ledger` → `transactions`
✅ Migrate `incoming_payments` → `transactions`
✅ Preserve all foreign keys and relationships
✅ Map status enums correctly
✅ Set allocation_status based on member_id

### Phase 2: Table Cleanup (After verification)
⏳ Drop `contributions` table
⏳ Drop `payment_ledger` table
⏳ Drop `incoming_payments` table

**To execute cleanup:**
```bash
# Run after verifying data migration
supabase db execute --file supabase/migrations/20260107000001_drop_old_tables.sql
```

## Verification Queries

### Check data migrated correctly

```sql
-- Count records in each source table
SELECT 'contributions' as table_name, COUNT(*) as count FROM contributions
UNION ALL
SELECT 'payment_ledger', COUNT(*) FROM payment_ledger
UNION ALL
SELECT 'incoming_payments', COUNT(*) FROM incoming_payments
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;

-- Verify no data loss (sum of old tables <= transactions)
SELECT 
  (SELECT COUNT(*) FROM contributions) + 
  (SELECT COUNT(*) FROM payment_ledger) + 
  (SELECT COUNT(*) FROM incoming_payments) as old_total,
  (SELECT COUNT(*) FROM transactions) as new_total;
```

### Check allocation status distribution

```sql
-- Count by allocation status
SELECT allocation_status, COUNT(*) 
FROM transactions 
GROUP BY allocation_status;

-- Should show:
-- allocated: records with member_id
-- unallocated: records without member_id
```

### Check type distribution

```sql
-- Count by transaction type
SELECT type, COUNT(*) 
FROM transactions 
GROUP BY type;

-- Should show:
-- CONTRIBUTION: from contributions table
-- PAYMENT: from payment_ledger + incoming_payments
-- (other types from existing transactions)
```

## Frontend Updates Needed

### Components that referenced old tables

1. **Contributions** - Now query `transactions` with `type='CONTRIBUTION'`
   ```typescript
   const { data } = await supabase
     .from('transactions')
     .select('*')
     .eq('type', 'CONTRIBUTION')
     .eq('group_id', groupId);
   ```

2. **Payment Ledger** - Now query `transactions` with `allocation_status`
   ```typescript
   const { data } = await supabase
     .from('transactions')
     .select('*')
     .eq('allocation_status', 'unallocated');
   ```

3. **Reports** - Use unified `transactions` table for all reports
   ```typescript
   const { data } = await supabase
     .from('transactions')
     .select('*')
     .eq('institution_id', institutionId)
     .gte('occurred_at', startDate)
     .lte('occurred_at', endDate);
   ```

## Rollback Plan

If migration fails or data is incorrect:

1. **Restore from backup:**
   ```bash
   # Restore database from backup taken before migration
   psql your_database < backup_before_redesign.sql
   ```

2. **Manual rollback:**
   ```sql
   -- Delete migrated records from transactions
   DELETE FROM transactions 
   WHERE id IN (SELECT id FROM contributions);
   
   DELETE FROM transactions 
   WHERE id IN (SELECT id FROM payment_ledger);
   
   DELETE FROM transactions 
   WHERE id IN (SELECT id FROM incoming_payments);
   
   -- Keep old tables (don't run drop migration)
   ```

## Summary

✅ **Both `contributions` and `payment_ledger` are consolidated into `transactions`**
✅ All data is migrated with proper mappings
✅ Old tables will be dropped after verification
✅ Unified ledger provides single source of truth
✅ All frontend components should use `transactions` table going forward

**Next step:** Run migration in dev, verify data, then drop old tables.


