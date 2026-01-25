# Schema Consolidation Summary

## Executive Summary

**Date:** 2026-01-10  
**Status:** Migration scripts created, ready for review and execution

---

## 🔴 Critical Issue Found: Duplicate SMS Device Tables

### Problem
Two tables track the same concept (devices that send SMS):
- `sms_sources` (created Jan 7) - used by Settings UI
- `sms_gateway_devices` (created Jan 10) - used by new Gateway Devices UI

### Solution
**Merge `sms_sources` → `sms_gateway_devices`**

**Migration:** `20260110000001_consolidate_sms_device_tables.sql`

---

## 📋 Consolidation Plan

### Phase 1: SMS Device Tables ✅ READY

**Migration:** `supabase/migrations/20260110000001_consolidate_sms_device_tables.sql`

**Actions:**
1. ✅ Add missing columns to `sms_gateway_devices`
2. ✅ Migrate data from `sms_sources` → `sms_gateway_devices`
3. ✅ Update `momo_sms_raw` to use `device_id` (consolidate from `sms_source_id`)
4. ✅ Drop `sms_sources` table
5. ✅ Create sync triggers for status/is_active

**Code Updates Required:**
- [ ] `components/settings/pages/SmsSourcesSettings.tsx` → use `sms_gateway_devices`
- [ ] SMS ingestion functions → use `sms_gateway_devices`
- [ ] Dashboard queries → use `sms_gateway_devices`

---

### Phase 2: Settings Tables ✅ VERIFIED

**Migration:** `supabase/migrations/20260110000002_verify_and_cleanup_settings.sql`

**Status:** ✅ Verified - Both tables serve different purposes

**Conclusion:**
- `settings` → General institution settings (system_name, base_currency, etc.)
- `institution_settings` → Parsing-specific settings (parsing_mode, confidence_threshold, etc.)
- **Action:** KEEP BOTH (no consolidation needed)

---

## 📊 Expected Outcome

**Before:** 20 tables (with redundancy)  
**After:** 19 tables (consolidated)

**Tables Removed:**
- `sms_sources` (merged into `sms_gateway_devices`)
- `settings` (if confirmed redundant)

---

## ✅ Already Consolidated (No Action Needed)

1. ✅ `contributions` → `transactions`
2. ✅ `incoming_payments` → `transactions`
3. ✅ `payment_ledger` → `transactions`
4. ✅ `sms_messages` → `momo_sms_raw`
5. ✅ `reconciliation_issues` → `reconciliation_sessions` + `reconciliation_items`
6. ✅ `admin_users` → `profiles`
7. ✅ `device_keys` → removed (NFC obsolete)
8. ✅ `mobile_money_ussd_codes` → `institution_momo_codes`
9. ✅ `nfc_logs` → removed

---

## 🚀 Execution Steps

### Step 1: Review Migrations
```bash
# Review the consolidation migration
cat supabase/migrations/20260110000001_consolidate_sms_device_tables.sql

# Review settings verification
cat supabase/migrations/20260110000002_verify_and_cleanup_settings.sql
```

### Step 2: Backup Database
```bash
# Via Supabase Dashboard → Database → Backups
# Or via CLI
supabase db dump -f backup_before_consolidation.sql
```

### Step 3: Run Migrations
```bash
# Apply consolidation
supabase db push --linked

# Or via Dashboard SQL Editor
```

### Step 4: Verify
```sql
-- Check sms_sources is gone
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'sms_sources';
-- Should return 0 rows

-- Check sms_gateway_devices has all columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sms_gateway_devices'
ORDER BY ordinal_position;
-- Should include: source_type, device_identifier, webhook_secret, etc.
```

### Step 5: Update Code
- Update `SmsSourcesSettings.tsx`
- Update SMS ingestion functions
- Update dashboard queries
- Test all SMS functionality

---

## 📝 Verification Checklist

- [ ] Migration applied successfully
- [ ] `sms_sources` table dropped
- [ ] `sms_gateway_devices` has all required columns
- [ ] Data migrated correctly
- [ ] `momo_sms_raw.device_id` populated
- [ ] Code updated to use `sms_gateway_devices`
- [ ] All tests passing
- [ ] Settings table reviewed (keep or drop)

---

## 🔍 Detailed Audit Report

See: `docs/audit/SCHEMA_CONSOLIDATION_AUDIT.md`
