# Apply Migration - Step by Step

## Current Status
You have **19 tables** - the migration needs to be applied to reduce to **~13 tables**.

## Steps to Apply:

### 1. Open SQL Editor
In your Supabase Dashboard:
- Click on **"SQL Editor"** in the left sidebar (or go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new)

### 2. Copy the Migration SQL
Open the file: `apply_migration_now.sql` in this directory
- Copy **ALL** the contents (272 lines)

### 3. Paste and Run
- Paste the SQL into the SQL Editor
- Click the **"Run"** button (or press Cmd+Enter)
- Wait for it to complete (~30 seconds)

### 4. Verify
After running, go back to **Table Editor**:
- You should see **~13 tables** instead of 19
- These tables should be **GONE**:
  - ❌ branches
  - ❌ group_members  
  - ❌ institution_settings
  - ❌ loans
  - ❌ meetings
  - ❌ payers
  - ❌ reconciliation_items

### 5. Check Success Messages
In the SQL Editor output, look for:
- ✅ `SUCCESS: All target tables deleted`
- ✅ `SUCCESS: Institutions table has all settings columns`
- ✅ `SUCCESS: Groups table has members JSONB column`
- ✅ `SUCCESS: Reconciliation_sessions table has items JSONB column`

---

## Quick Command to View SQL:
```bash
cat apply_migration_now.sql
```

Then copy and paste into Supabase SQL Editor.
