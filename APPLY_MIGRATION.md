# Apply Migration - Quick Steps

## ✅ Ready to Apply

The migration file is ready at: `docs/audit/RUN_MIGRATION_NOW.sql`

## Steps:

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new

2. **Copy the migration SQL:**
   ```bash
   cat docs/audit/RUN_MIGRATION_NOW.sql
   ```
   OR open the file: `docs/audit/RUN_MIGRATION_NOW.sql`

3. **Paste and Run:**
   - Paste entire SQL into the editor
   - Click "Run" button
   - Wait for completion (~30 seconds)

4. **Verify Success:**
   Look for these messages:
   - ✅ `SUCCESS: All target tables deleted`
   - ✅ `SUCCESS: Institutions table has all settings columns`
   - ✅ `SUCCESS: Groups table has members JSONB column`
   - ✅ `SUCCESS: Reconciliation_sessions table has items JSONB column`

## What This Does:

- Consolidates `institution_settings` → `institutions`
- Consolidates `group_members` → `groups.members` (JSONB)
- Consolidates `reconciliation_items` → `reconciliation_sessions.items` (JSONB)
- Deletes `branches`, `loans`, `meetings`, `payers` tables

**Result:** ~20 tables → ~13 tables

---

**All code is already updated and ready!** ✅
