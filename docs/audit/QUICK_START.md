# Quick Start - Apply Migration Now

## Step 1: Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new**

## Step 2: Copy Migration SQL

Open: `docs/audit/RUN_MIGRATION_NOW.sql`

**OR** copy from: `supabase/migrations/20260110000003_aggressive_consolidation.sql`

## Step 3: Paste and Run

1. Paste the entire SQL into the SQL Editor
2. Click **"Run"** button
3. Wait for completion (should take < 30 seconds)

## Step 4: Verify Success

Look for these messages in the output:
- ✅ `SUCCESS: All target tables deleted`
- ✅ `SUCCESS: Institutions table has all settings columns`
- ✅ `SUCCESS: Groups table has members JSONB column`
- ✅ `SUCCESS: Reconciliation_sessions table has items JSONB column`

## Step 5: Test Application

1. Open your application
2. Test parsing settings page
3. Test groups page (check member counts)
4. Test institution drawer (should not have branches tab)
5. Check browser console for errors

---

## If Something Goes Wrong

**Rollback:** Restore from Supabase Dashboard → Database → Backups

**Check Logs:** Supabase Dashboard → Database → Logs

---

## What This Migration Does

1. ✅ Merges `institution_settings` → `institutions` table
2. ✅ Merges `group_members` → `groups.members` (JSONB array)
3. ✅ Merges `reconciliation_items` → `reconciliation_sessions.items` (JSONB array)
4. ✅ Deletes `branches` table
5. ✅ Deletes `loans` table
6. ✅ Deletes `meetings` table
7. ✅ Deletes `payers` table (if exists)

**Result:** ~20 tables → ~13 tables
