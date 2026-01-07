# Supabase Schema Inventory & Redesign

## Executive Summary

This document inventories existing tables, identifies duplicates/unused entities, and outlines the consolidated redesign for the minimalist staff/admin operations system.

## Existing Tables (Current State)

### Core Multi-Tenant Tables
1. **institutions** - ✅ KEEP (with enhancements)
   - Purpose: SACCOs/MFIs/Banks
   - Current: id, name, type, status, code, supervisor, total_assets
   - **Changes**: Add `momo_code` support (via separate table)

2. **profiles** - ✅ KEEP (simplified)
   - Purpose: Staff users (1:1 with auth.users)
   - Current: user_id, institution_id, role, email, full_name, branch, status
   - **Changes**: Simplify roles to `admin | staff`, enforce institution_id for staff

### SACCO Structure
3. **groups** - ✅ KEEP (minor cleanup)
   - Purpose: Savings groups (Ibimina)
   - Current: id, institution_id, group_name, status, expected_amount, frequency, etc.
   - **Status**: Good, minor field cleanup

4. **members** - ✅ KEEP (add group_id relationship)
   - Purpose: SACCO members
   - Current: id, institution_id, full_name, phone, status, kyc_status, balances
   - **Changes**: Add `group_id` FK, enforce `member.institution_id == group.institution_id`

5. **group_members** - ✅ KEEP
   - Purpose: Many-to-many member↔group with roles
   - Current: id, institution_id, group_id, member_id, role, status
   - **Status**: Keep for multiple group membership

### Financial Transactions
6. **contributions** - ❌ REMOVE (merged into transactions)
   - Purpose: Member contributions
   - **Action**: Merge data into `transactions` table with type='CONTRIBUTION'
   - **Migration**: Move existing data, then drop table

7. **transactions** - ✅ KEEP (major redesign)
   - Purpose: Unified transaction ledger (parsed from MoMo SMS)
   - Current: id, institution_id, member_id, group_id, type, amount, currency, channel, status, reference
   - **Changes**:
     - Add `momo_sms_id` (FK to momo_sms_raw)
     - Add `occurred_at` (transaction timestamp, not created_at)
     - Add `payer_phone`, `payer_name`, `momo_ref`
     - Add `parse_confidence`, `status` enum ('allocated' | 'unallocated' | 'error' | 'duplicate' | 'reversed')
     - Remove manual creation capability (only from SMS parsing)

8. **incoming_payments** - ❌ REMOVE (duplicate of transactions)
   - Purpose: Unreconciled payments
   - **Action**: This is duplicate logic - use `transactions` with status='unallocated'

9. **payment_ledger** - ❌ REMOVE (duplicate of transactions)
   - Purpose: Payment tracking
   - **Action**: Duplicate - transactions table already handles this

### SMS & MoMo Parsing
10. **sms_messages** - ✅ REDESIGN → **momo_sms_raw**
    - Purpose: Raw MoMo SMS before parsing
    - Current: id, institution_id, sender, timestamp, body, is_parsed, parsed_* fields
    - **Changes**:
      - Rename to `momo_sms_raw`
      - Add `source` (android_gateway | manual_import)
      - Add `hash` (for deduplication)
      - Add `parse_status` enum ('pending' | 'success' | 'error')
      - Add `parse_error` text
      - Remove `parsed_*` fields (move to transactions)

### Reconciliation
11. **reconciliation_issues** - ✅ REDESIGN → **reconciliation_sessions + reconciliation_items**
    - Current: id, institution_id, source, amount, source_reference, ledger_status, status, detected_at, resolved_at
    - **Changes**:
      - Split into `reconciliation_sessions` (work sessions) and `reconciliation_items` (individual issues)
      - Add session workflow (open → resolve → close)
      - Link items to transactions

### Other Entities
12. **meetings** - ✅ KEEP (optional, not core to MVP)
    - Purpose: Group meetings
    - Status: Keep for future features, not required for MVP

13. **loans** - ✅ KEEP (optional, not core to MVP)
    - Purpose: Member loans
    - Status: Keep for future, but Transactions page focuses on contributions/allocation

14. **withdrawals** - ✅ KEEP (optional)
    - Purpose: Withdrawal requests
    - Status: Keep but not part of core allocation workflow

15. **branches** - ✅ KEEP
    - Purpose: Institution branches
    - Status: Good

16. **settings** - ✅ KEEP
    - Purpose: Institution settings
    - Status: Good

17. **nfc_logs** - ❌ REMOVE (removed in migration 20260106000002)
    - Status: Already removed

## New Tables Required

### MoMo Code Management
18. **institution_momo_codes** - 🆕 NEW
    - Purpose: Map MoMo codes to institutions (1 institution can have multiple codes)
    - Columns: id, institution_id, momo_code, is_active, created_at

### Transaction Allocation Audit
19. **transaction_allocations** - 🆕 NEW (optional but recommended)
    - Purpose: Audit trail for allocations (who allocated what when)
    - Columns: id, transaction_id, member_id, group_id, allocated_by, allocated_at
    - Alternative: Store directly on transactions, but audit log is cleaner

### Audit Logging
20. **audit_log** - 🆕 NEW
    - Purpose: System-wide audit trail
    - Columns: id, actor_user_id, institution_id, action, entity_type, entity_id, metadata jsonb, created_at

## Tables to Remove

1. **contributions** - Merge into transactions
2. **incoming_payments** - Duplicate of transactions
3. **payment_ledger** - Duplicate of transactions
4. **nfc_logs** - Already removed

## Consolidated Schema Design

### Core Flow: SMS → Transactions → Allocation

```
momo_sms_raw (raw SMS)
    ↓ [parse_momo_sms function]
transactions (parsed, status='unallocated')
    ↓ [allocate_transaction function]
transactions (status='allocated', member_id set)
    ↓ [audit log]
transaction_allocations (audit trail)
```

### Multi-Tenant RLS Pattern

All tables use:
- `institution_id` on every row (except admin global tables)
- RLS policy: `is_platform_admin() OR institution_id = current_institution_id()`
- Admin: sees all
- Staff: sees only their institution

### Key Constraints

1. **member.institution_id == group.institution_id** (enforced by trigger)
2. **transactions can only be created via SMS parsing** (enforced by RLS + function)
3. **transactions.status='unallocated' → no member_id/group_id**
4. **transactions.status='allocated' → must have member_id + group_id**

## Migration Strategy

1. Create new tables (momo_sms_raw, institution_momo_codes, transaction_allocations, audit_log)
2. Migrate data:
   - `incoming_payments` → `transactions`
   - `contributions` → `transactions` (with type='CONTRIBUTION')
   - `payment_ledger` → `transactions`
   - `sms_messages` → `momo_sms_raw`
3. Update `transactions` table structure
4. Drop old tables
5. Update RLS policies
6. Create functions (parse_momo_sms, allocate_transaction, bulk imports)

## Summary

- **Keep**: 12 tables (institutions, profiles, groups, members, group_members, transactions, momo_sms_raw, reconciliation_sessions, reconciliation_items, meetings, loans, withdrawals, branches, settings)
- **Remove**: 4 tables (contributions, incoming_payments, payment_ledger, nfc_logs)
- **New**: 4 tables (institution_momo_codes, transaction_allocations, audit_log, reconciliation_sessions, reconciliation_items)
- **Redesign**: 2 tables (sms_messages → momo_sms_raw, reconciliation_issues → sessions+items)


