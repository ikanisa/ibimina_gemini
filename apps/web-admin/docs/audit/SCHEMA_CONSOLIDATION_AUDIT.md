# Supabase Schema Consolidation Audit

**Date:** 2026-01-10  
**Purpose:** Comprehensive review and consolidation of redundant tables

---

## 🔴 CRITICAL REDUNDANCIES FOUND

### 1. SMS Device Tracking (DUPLICATE FUNCTIONALITY)

**Problem:** Two tables tracking the same concept - devices that send SMS

#### `sms_sources` (created 2026-01-07)
- **Purpose:** SMS source devices/webhooks per institution
- **Columns:** id, institution_id, name, source_type, device_identifier, webhook_secret, is_active, last_seen_at, message_count
- **Used by:** 
  - `SmsSourcesSettings.tsx` component
  - SMS ingestion functions (`ingest_sms_v2`)
  - Dashboard health monitoring
- **References:** `momo_sms_raw.sms_source_id`

#### `sms_gateway_devices` (created 2026-01-10)
- **Purpose:** Registered phones that forward MoMo payment SMS using a MoMo Code
- **Columns:** id, institution_id, device_name, momo_code, status, device_key_hash, last_sms_received_at
- **Used by:**
  - `SmsGatewayDevices.tsx` component (NEW)
  - SMS routing by MoMo code
- **References:** `momo_sms_raw.device_id` (NEW column)

**Issue:** Both tables track devices that send SMS, but with different schemas and purposes.

**Recommendation:** 
- **MERGE** into single `sms_gateway_devices` table
- Add missing columns from `sms_sources`:
  - `source_type` (android_gateway/webhook/manual)
  - `device_identifier` (for Android devices)
  - `webhook_secret` (for webhook sources)
  - `message_count` (tracking)
- Keep `momo_code` (routing key) from new table
- Keep `device_key_hash` (authentication) from new table
- Migrate `sms_sources` data → `sms_gateway_devices`
- Update `momo_sms_raw.sms_source_id` → `device_id`
- Drop `sms_sources` table

---

## 🟡 POTENTIAL REDUNDANCIES

### 2. Settings Tables ✅ DIFFERENT PURPOSES

#### `settings` (general institution settings)
- **Purpose:** General institution configuration
- **Columns:** institution_id (PK), system_name, base_currency, momo_shortcode, momo_merchant_id, auto_reconcile, notifications_enabled
- **Status:** ✅ KEEP - General settings

#### `institution_settings` (parsing-specific settings)
- **Purpose:** SMS parsing and notification configuration
- **Columns:** institution_id (PK), parsing_mode, confidence_threshold, dedupe_window_minutes, low_confidence_alert_enabled, etc.
- **Status:** ✅ KEEP - Parsing-specific settings

**Conclusion:** Both tables serve different purposes. **KEEP BOTH.**

---

### 3. MoMo Code Tracking

#### `institution_momo_codes` ✅ KEEP
- **Purpose:** MoMo codes associated with institutions (1 institution can have multiple codes)
- **Status:** ✅ This is the correct table, already consolidated from `mobile_money_ussd_codes`

**Note:** `sms_gateway_devices.momo_code` is a **routing identifier** (which code the device uses), not the same as `institution_momo_codes` (which codes belong to the institution).

---

## ✅ CORRECTLY CONSOLIDATED (Already Done)

1. ✅ `contributions` → merged into `transactions`
2. ✅ `incoming_payments` → merged into `transactions`
3. ✅ `payment_ledger` → merged into `transactions`
4. ✅ `sms_messages` → replaced by `momo_sms_raw`
5. ✅ `reconciliation_issues` → replaced by `reconciliation_sessions` + `reconciliation_items`
6. ✅ `admin_users` → redundant with `profiles`
7. ✅ `device_keys` → obsolete (NFC removed)
8. ✅ `mobile_money_ussd_codes` → replaced by `institution_momo_codes`
9. ✅ `nfc_logs` → obsolete

---

## 📊 CURRENT TABLE INVENTORY

### Core Tables (14)
1. `institutions` ✅
2. `profiles` ✅
3. `groups` ✅
4. `members` ✅
5. `group_members` ✅
6. `transactions` ✅
7. `momo_sms_raw` ✅

### SMS & MoMo Tables (3)
8. `institution_momo_codes` ✅
9. `sms_sources` 🔴 **REDUNDANT** (merge into sms_gateway_devices)
10. `sms_gateway_devices` 🔴 **REDUNDANT** (merge sms_sources into this)

### Audit & Reconciliation (4)
11. `transaction_allocations` ✅
12. `reconciliation_sessions` ✅
13. `reconciliation_items` ✅
14. `audit_log` ✅

### Settings & Configuration (2)
15. `institution_settings` ✅ (parsing-specific)
16. `settings` ✅ (general institution settings - different purpose)

### Optional Tables (4)
17. `loans` ✅
18. `meetings` ✅
19. `branches` ✅
20. `withdrawals` ✅

**Total: 20 tables** (will be 19 after SMS device consolidation)

---

## 🎯 CONSOLIDATION PLAN

### Phase 1: Merge SMS Device Tables

**Goal:** Single table for all SMS-sending devices

**New Unified Schema:**
```sql
create table public.sms_gateway_devices (
  id uuid primary key,
  institution_id uuid not null references institutions(id),
  
  -- Identification
  device_name text not null,
  momo_code text not null, -- routing identifier
  
  -- Source type
  source_type text not null default 'android_gateway' 
    check (source_type in ('android_gateway', 'webhook', 'manual')),
  device_identifier text, -- for Android devices
  webhook_secret text, -- for webhook sources
  
  -- Authentication
  device_key_hash text not null, -- for device authentication
  
  -- Status
  status text not null default 'active' 
    check (status in ('active', 'suspended')),
  is_active boolean not null default true, -- alias for status
  
  -- Tracking
  last_sms_received_at timestamptz null,
  last_seen_at timestamptz null, -- alias for last_sms_received_at
  message_count int not null default 0,
  
  -- Metadata
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  
  constraint sms_gateway_devices_unique_momo_code unique (momo_code),
  constraint sms_gateway_devices_unique_device_identifier unique (institution_id, device_identifier) 
    where device_identifier is not null
);
```

**Migration Steps:**
1. Add missing columns to `sms_gateway_devices`
2. Migrate data from `sms_sources` → `sms_gateway_devices`
3. Update `momo_sms_raw.sms_source_id` → `device_id` (if not already done)
4. Drop `sms_sources` table
5. Update all code references

---

### Phase 2: Verify Settings Tables

**Action:**
1. Check if `settings` table exists and has data
2. If empty/redundant → drop
3. If has data → migrate to `institution_settings` or keep if different purpose

---

## 📝 MIGRATION CHECKLIST

- [ ] Create migration to merge `sms_sources` → `sms_gateway_devices`
- [ ] Update `momo_sms_raw` to use only `device_id` (remove `sms_source_id`)
- [ ] Update `SmsSourcesSettings.tsx` to use `sms_gateway_devices`
- [ ] Update SMS ingestion functions to use `sms_gateway_devices`
- [ ] Update dashboard queries to use `sms_gateway_devices`
- [ ] Drop `sms_sources` table
- [ ] Verify `settings` table status
- [ ] Test all SMS-related functionality
- [ ] Update documentation

---

## 🔍 VERIFICATION QUERIES

```sql
-- Check for redundant tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sms_sources', 'sms_gateway_devices', 'settings')
ORDER BY table_name;

-- Check momo_sms_raw references
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'momo_sms_raw'
  AND column_name IN ('sms_source_id', 'device_id');

-- Count records in each SMS device table
SELECT 'sms_sources' as table_name, COUNT(*) as count FROM sms_sources
UNION ALL
SELECT 'sms_gateway_devices', COUNT(*) FROM sms_gateway_devices;
```

---

## 📈 EXPECTED OUTCOME

**Before:** 20 tables (with redundancy)  
**After:** 19 tables (consolidated)

**Benefits:**
- Single source of truth for SMS devices
- Simpler queries and joins
- Reduced maintenance overhead
- Clearer data model
