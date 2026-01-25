# Aggressive Schema Consolidation Plan

## Overview

**Goal:** Reduce table count by consolidating related tables and deleting unused ones.

**Tables to Consolidate:**
1. `institution_settings` → `institutions`
2. `group_members` → `groups` (as JSONB array)
3. `reconciliation_items` → `reconciliation_sessions` (as JSONB array)

**Tables to Delete:**
1. `branches`
2. `loans`
3. `meetings`
4. `payers` (if exists)

---

## Consolidation Details

### 1. institution_settings → institutions

**Action:** Add all columns from `institution_settings` to `institutions`, migrate data, drop `institution_settings`.

**Columns to add:**
- `parsing_mode` (text)
- `confidence_threshold` (numeric)
- `dedupe_window_minutes` (int)
- `low_confidence_alert_enabled` (boolean)
- `unallocated_alert_threshold` (int)

**Impact:** Settings are now directly on institutions table.

---

### 2. group_members → groups

**Action:** Store member relationships as JSONB array in `groups.members`.

**Structure:**
```json
[
  {
    "member_id": "uuid",
    "role": "CHAIRPERSON|SECRETARY|TREASURER|MEMBER",
    "status": "GOOD_STANDING|IN_ARREARS|DEFAULTED",
    "joined_date": "date",
    "created_at": "timestamp"
  }
]
```

**Impact:** 
- Many-to-many relationship flattened into groups table
- Queries will use JSONB operators instead of joins
- Code must be updated to use JSONB array

---

### 3. reconciliation_items → reconciliation_sessions

**Action:** Store items as JSONB array in `reconciliation_sessions.items`.

**Structure:**
```json
[
  {
    "id": "uuid",
    "transaction_id": "uuid",
    "issue_type": "enum",
    "resolution": "text",
    "resolved_by": "uuid",
    "resolved_at": "timestamp",
    "metadata": "jsonb"
  }
]
```

**Impact:**
- One-to-many relationship flattened
- Queries will use JSONB operators

---

### 4. Delete branches

**Action:** Drop table, remove any FK references.

**Impact:** 
- `members.branch` (text) remains (not a FK)
- Any code referencing branches table must be removed

---

### 5. Delete loans

**Action:** Drop table.

**Impact:**
- Any loan tracking functionality removed
- `members.loan_balance` can remain as calculated field

---

### 6. Delete meetings

**Action:** Drop table, remove `meeting_id` from transactions if exists.

**Impact:**
- Meeting tracking removed
- `groups.meeting_day` and `groups.next_meeting_date` can remain

---

### 7. Delete payers (if exists)

**Action:** Drop table if it exists.

---

## Code Updates Required

### Frontend Components

1. **Institution Settings:**
   - Update to read from `institutions` table instead of `institution_settings`
   - Update writes to update `institutions` table

2. **Groups:**
   - Update to use `groups.members` JSONB array
   - Replace `group_members` queries with JSONB operations
   - Update member add/remove to modify JSONB array

3. **Reconciliation:**
   - Update to use `reconciliation_sessions.items` JSONB array
   - Replace `reconciliation_items` queries

4. **Branches:**
   - Remove all branch management UI
   - Keep `members.branch` as text field only

5. **Loans/Meetings:**
   - Remove any loan/meeting management UI

### Database Functions

1. Update any RPC functions that reference:
   - `group_members` → use `groups.members` JSONB
   - `reconciliation_items` → use `reconciliation_sessions.items` JSONB
   - `institution_settings` → use `institutions` columns
   - `branches`, `loans`, `meetings` → remove

---

## Migration Execution

**File:** `supabase/migrations/20260110000003_aggressive_consolidation.sql`

**Steps:**
1. Add columns to target tables
2. Migrate data (convert to JSONB where needed)
3. Drop source tables
4. Clean up orphaned FKs
5. Create JSONB indexes

---

## Verification Queries

```sql
-- Check tables are deleted
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('branches', 'loans', 'meetings', 'payers', 'group_members', 'institution_settings', 'reconciliation_items')
ORDER BY table_name;
-- Should return 0 rows

-- Check institutions has settings columns
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'institutions'
  AND column_name IN ('parsing_mode', 'confidence_threshold', 'dedupe_window_minutes');
-- Should return 3 rows

-- Check groups has members JSONB
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'groups'
  AND column_name = 'members';
-- Should return: members | jsonb

-- Check reconciliation_sessions has items JSONB
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reconciliation_sessions'
  AND column_name = 'items';
-- Should return: items | jsonb
```

---

## Expected Outcome

**Before:** ~20 tables  
**After:** ~13 tables

**Tables Remaining:**
1. institutions (with settings)
2. profiles
3. groups (with members JSONB)
4. members
5. transactions
6. momo_sms_raw
7. sms_gateway_devices
8. institution_momo_codes
9. reconciliation_sessions (with items JSONB)
10. transaction_allocations
11. audit_log
12. settings (general)
13. withdrawals (optional)
