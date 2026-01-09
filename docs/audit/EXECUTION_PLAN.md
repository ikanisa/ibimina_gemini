# Schema Consolidation Execution Plan

## Quick Start

### Critical Redundancy Found
**`sms_sources` and `sms_gateway_devices` are duplicates** - both track SMS-sending devices.

### Solution
Merge `sms_sources` → `sms_gateway_devices` (single unified table)

---

## Migration Files Created

1. **`20260110000001_consolidate_sms_device_tables.sql`** ⭐ MAIN MIGRATION
   - Merges `sms_sources` into `sms_gateway_devices`
   - Updates `momo_sms_raw` references
   - Drops `sms_sources` table

2. **`20260110000002_verify_and_cleanup_settings.sql`** ✅ VERIFICATION
   - Verifies `settings` vs `institution_settings` (confirmed: different purposes, keep both)

---

## Pre-Migration Checklist

- [ ] **Backup database** (Supabase Dashboard → Backups)
- [ ] Review migration SQL: `supabase/migrations/20260110000001_consolidate_sms_device_tables.sql`
- [ ] Check current data:
  ```sql
  SELECT COUNT(*) FROM sms_sources;
  SELECT COUNT(*) FROM sms_gateway_devices;
  ```

---

## Execution Steps

### Option A: Supabase CLI (Recommended)

```bash
cd /Volumes/PRO-G40/Projects/repos/ibimina_gemini

# Link to project (if not already)
supabase link --project-ref wadhydemushqqtcrrlwm

# Apply migration
supabase db push --linked --yes
```

### Option B: Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new
2. Open: `supabase/migrations/20260110000001_consolidate_sms_device_tables.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success

---

## Post-Migration Verification

```sql
-- 1. Verify sms_sources is gone
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'sms_sources';
-- Expected: 0 rows

-- 2. Verify sms_gateway_devices has all columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sms_gateway_devices'
ORDER BY ordinal_position;
-- Should include: source_type, device_identifier, webhook_secret, message_count, etc.

-- 3. Verify data migrated
SELECT COUNT(*) as total_devices FROM sms_gateway_devices;
SELECT 
  source_type,
  COUNT(*) as count
FROM sms_gateway_devices
GROUP BY source_type;

-- 4. Verify momo_sms_raw references
SELECT 
  COUNT(*) as total_sms,
  COUNT(device_id) as with_device_id,
  COUNT(sms_source_id) as with_sms_source_id
FROM momo_sms_raw;
```

---

## Code Updates Required

After migration, update these files:

### 1. `components/settings/pages/SmsSourcesSettings.tsx`
- Change `from('sms_sources')` → `from('sms_gateway_devices')`
- Update column names if needed

### 2. SMS Ingestion Functions
- Update `ingest_sms_v2()` or similar functions
- Change references from `sms_sources` → `sms_gateway_devices`

### 3. Dashboard Queries
- Update any queries that reference `sms_sources`
- Use `sms_gateway_devices` instead

### 4. Edge Functions (if any)
- Update any Edge Functions that use `sms_sources`

---

## Rollback Plan

If issues occur:

```sql
-- Restore from backup
-- Or manually recreate sms_sources if needed (not recommended)

-- Check what data exists
SELECT * FROM sms_gateway_devices WHERE source_type IS NOT NULL;
```

---

## Expected Results

**Before:**
- 2 tables: `sms_sources`, `sms_gateway_devices`
- `momo_sms_raw` has both `sms_source_id` and `device_id`

**After:**
- 1 table: `sms_gateway_devices` (unified)
- `momo_sms_raw` uses only `device_id`
- All SMS device data in one place

---

## Summary

✅ **Migration Ready:** `20260110000001_consolidate_sms_device_tables.sql`  
✅ **Settings Verified:** Both `settings` and `institution_settings` are needed  
✅ **Documentation:** Complete audit reports in `docs/audit/`

**Next Step:** Review and apply the migration.
