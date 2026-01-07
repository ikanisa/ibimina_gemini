# Reconciliation Module Implementation Report

## Phase 4: Reconciliation (Unallocated Queue + Parse Errors + Duplicates)

**Date:** January 7, 2026  
**Status:** ✅ Implemented

---

## Overview

Implemented `/reconciliation` as the operational workbench for resolving unallocated transactions, parse errors, and duplicate transactions. The UI is minimalist with exactly 3 tabs and a queue + detail panel layout.

---

## Inventory (Pre-Implementation Audit)

### Existing Components (Replaced)
- `components/Reconciliation.tsx` - Old implementation using deprecated `reconciliation_issues` table
- Used `payment_ledger` table (no longer exists)

### Existing Tables (Reused)
- `transactions` - Main transaction table with `allocation_status` enum
- `momo_sms_raw` - Raw SMS storage with `parse_status` enum
- `institution_settings` - Has `dedupe_window_minutes` setting
- `audit_log` - For action logging

### Existing RPCs (Reused)
- `allocate_transaction(p_transaction_id, p_member_id, p_note)` - From Phase 3

---

## Backend Implementation

### Migration: `20260107400000_reconciliation_module.sql`

#### 1. Columns Added to `transactions`
```sql
- canonical_transaction_id uuid (FK to transactions.id)
- duplicate_reason text
- flag_reason text
- updated_at timestamptz
- updated_by uuid
```

#### 2. Columns Added to `momo_sms_raw`
```sql
- resolution_status text ('open'|'ignored'|'not_payment'|'retried'|'resolved')
- resolution_note text
- resolved_by uuid
- resolved_at timestamptz
```

#### 3. Indexes Added
```sql
- idx_transactions_institution_momo_tx_id (for exact duplicate detection)
- idx_transactions_fingerprint (amount + payer_phone + time for fingerprint detection)
- idx_transactions_canonical (for linking duplicates)
- idx_momo_sms_raw_resolution (for open parse errors)
```

#### 4. View Created: `vw_duplicate_candidates`
Detects duplicate candidates using two methods:
1. **momo_tx_id duplicates**: Exact match on transaction ID
2. **Fingerprint duplicates**: Same amount + payer_phone within 60-minute window

Returns: `institution_id, match_key, match_type, transaction_ids[], dupe_count`

#### 5. RPCs Created

| Function | Purpose | Parameters |
|----------|---------|------------|
| `retry_parse_sms(p_sms_id)` | Re-queue SMS for parsing | `p_sms_id uuid` |
| `resolve_sms_error(p_sms_id, p_resolution, p_note)` | Mark error as ignored/not_payment/resolved | `p_sms_id uuid, p_resolution text, p_note text` |
| `mark_transaction_duplicate(p_transaction_id, p_canonical_id, p_reason)` | Link duplicate to canonical | `p_transaction_id uuid, p_canonical_id uuid, p_reason text` |

All RPCs:
- Validate authentication
- Check institution access (RLS-aware)
- Write to `audit_log`

---

## Frontend Implementation

### Route: `/reconciliation`

### Components Created

| Component | Location | Purpose |
|-----------|----------|---------|
| `ReconciliationTabs` | `components/reconciliation/` | Tab navigation with counts |
| `QueueList` | `components/reconciliation/` | Queue display for each tab type |
| `DetailPanel` | `components/reconciliation/` | Detail view + actions for selected item |
| `MemberSearchPicker` | `components/reconciliation/` | Reusable member search for allocation |

### UI Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header: Title + Institution Switcher (PLATFORM_ADMIN only)  │
│ Filters: Search | Date Range | Filter Button               │
├────────────────────┬────────────────────────────────────────┤
│ Tabs + Queue List  │ Detail Panel (drawer on mobile)       │
│                    │                                        │
│ • Unallocated (45) │ Transaction/Error/Duplicate Details   │
│ • Parse Errors (15)│ + Primary Action Button               │
│ • Duplicates (6)   │ + Audit History                       │
│                    │                                        │
│ [Queue Items...]   │ [Selected Item Details...]            │
└────────────────────┴────────────────────────────────────────┘
```

### Tab Details

#### 1. Unallocated Tab
- **Data Source**: `transactions WHERE allocation_status = 'unallocated'`
- **Queue Display**: Amount, phone, payer name, age, aging warning (>24h)
- **Detail Panel**: Summary, raw SMS, allocate button
- **Action**: Allocate to member (via `allocate_transaction` RPC)

#### 2. Parse Errors Tab
- **Data Source**: `momo_sms_raw WHERE parse_status = 'error' AND resolution_status = 'open'`
- **Queue Display**: Error message, received time, sender phone
- **Detail Panel**: Error info, SMS text, resolution note
- **Actions**:
  - Retry Parse (calls `retry_parse_sms` then Edge Function)
  - Mark as "Not a Payment" (calls `resolve_sms_error`)
  - Mark as "Ignored" (calls `resolve_sms_error`)

#### 3. Duplicates Tab
- **Data Source**: `vw_duplicate_candidates` view
- **Queue Display**: Match type, count, match key
- **Detail Panel**: Instructions, transaction list in group
- **Actions**:
  - Select canonical transaction
  - Mark others as duplicate (calls `mark_transaction_duplicate`)

### Filters
- **Search**: Phone, MoMo ref, payer name
- **Date Range**: Today, 7 days, 30 days, 90 days
- **Institution Switcher**: PLATFORM_ADMIN only

### Responsive Design
- **Desktop**: Side-by-side queue + detail panel
- **Mobile**: Queue as full width, detail panel as slide-over drawer

---

## Seed Data

### File: `supabase/seed/009_reconciliation_demo_data.sql`

| Type | Count | Details |
|------|-------|---------|
| Unallocated Transactions | 55 | 45 recent + 10 aging (>24h) |
| Parse Errors | 15 | Various error types, all `resolution_status = 'open'` |
| Duplicate Groups | 6 | 3 by momo_tx_id + 3 by fingerprint |

---

## Audit Trail

All actions write to `audit_log`:
- `retry_parse_sms` - Logs previous status and error
- `resolve_sms_error` - Logs resolution type and note
- `mark_transaction_duplicate` - Logs canonical_id, reason, previous status
- `allocate_transaction` - Logs member_id, group_id (from Phase 3)

---

## Testing Recommendations

### Playwright Tests to Add
1. **Institution Scoping**
   - Staff sees only their institution's queue items
   - PLATFORM_ADMIN can switch institutions

2. **Unallocated Flow**
   - Allocating removes item from Unallocated tab
   - Allocated transaction appears in Transactions page

3. **Parse Error Flow**
   - Retry parse moves SMS from errors to pending (if successful)
   - Mark as ignored removes from queue

4. **Duplicate Flow**
   - Marking duplicate links to canonical
   - Duplicate removed from candidates view

5. **Audit Logging**
   - Each action creates audit_log row

---

## Files Changed

### New Files
- `supabase/migrations/20260107400000_reconciliation_module.sql`
- `components/reconciliation/ReconciliationTabs.tsx`
- `components/reconciliation/QueueList.tsx`
- `components/reconciliation/DetailPanel.tsx`
- `components/reconciliation/MemberSearchPicker.tsx`
- `components/reconciliation/index.ts`
- `supabase/seed/009_reconciliation_demo_data.sql`

### Modified Files
- `components/Reconciliation.tsx` - Complete rewrite

---

## Next Steps
1. Deploy migration with `supabase db push`
2. Run seed data
3. Test on staging
4. Add Playwright tests
5. Connect retry_parse_sms to Edge Function for full parse flow

