# Apply Aggressive Consolidation Migration

## ⚠️ IMPORTANT: Backup First!

**Before running this migration, backup your database:**
- Go to Supabase Dashboard → Database → Backups
- Create a manual backup

---

## Step 1: Apply Migration via Dashboard

1. Go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new
2. Open: `supabase/migrations/20260110000003_aggressive_consolidation.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success

---

## Step 2: Verify Migration

Run these queries in SQL Editor:

```sql
-- Check deleted tables are gone
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

## Step 3: Code Updates (See below)

After migration, update all code references as documented.
