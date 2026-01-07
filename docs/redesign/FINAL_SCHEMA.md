# Final Consolidated Schema

## Overview

This document describes the final schema after redesign consolidation. All tables support multi-tenant institution scoping with RLS.

## Core Tables

### `institutions`
Primary multi-tenant anchor. Each institution is a SACCO/MFI/Bank.

**Columns:**
- `id` (uuid, PK)
- `name` (text)
- `type` (enum: BANK | MFI | SACCO)
- `status` (text)
- `code` (text, unique)
- `supervisor` (text)
- `total_assets` (numeric)
- `created_at` (timestamptz)

### `institution_momo_codes`
MoMo codes associated with institutions (1 institution can have multiple codes).

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `momo_code` (text)
- `is_active` (boolean)
- `created_at` (timestamptz)
- Unique: `(institution_id, momo_code)`

### `profiles`
Staff users (1:1 with auth.users).

**Columns:**
- `user_id` (uuid, PK, FK → auth.users)
- `institution_id` (uuid, FK → institutions, nullable for admin)
- `role` (enum: PLATFORM_ADMIN | INSTITUTION_ADMIN | INSTITUTION_STAFF | ...)
- `email` (text)
- `full_name` (text)
- `branch` (text)
- `status` (enum: ACTIVE | SUSPENDED)
- `last_login_at` (timestamptz)
- `created_at`, `updated_at` (timestamptz)

**Business Rules:**
- Staff must have `institution_id` (admin can be null)
- Admin can see all institutions
- Staff can only see their institution

### `groups`
Savings groups (Ibimina).

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `group_name` (text)
- `status` (enum: ACTIVE | PAUSED | CLOSED)
- `expected_amount` (numeric)
- `frequency` (text: Weekly | Monthly)
- `currency` (text, default: 'RWF')
- `meeting_day` (text)
- `cycle_label` (text)
- `fund_balance` (numeric)
- `active_loans_count` (integer)
- `next_meeting_date` (date)
- `created_at`, `updated_at` (timestamptz)

### `members`
SACCO members.

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `group_id` (uuid, FK → groups, nullable)
- `full_name` (text)
- `phone` (text)
- `status` (text)
- `branch` (text)
- `kyc_status` (enum: VERIFIED | PENDING | REJECTED)
- `savings_balance` (numeric)
- `loan_balance` (numeric)
- `token_balance` (numeric)
- `join_date` (date)
- `created_at` (timestamptz)

**Business Rules:**
- `member.institution_id == group.institution_id` (enforced by trigger)
- Member can belong to multiple groups via `group_members` table

### `group_members`
Many-to-many member↔group with roles.

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `group_id` (uuid, FK → groups)
- `member_id` (uuid, FK → members)
- `role` (enum: CHAIRPERSON | SECRETARY | TREASURER | MEMBER)
- `status` (enum: GOOD_STANDING | IN_ARREARS | DEFAULTED)
- `joined_date` (date)
- `created_at` (timestamptz)

## SMS & Transaction Flow

### `momo_sms_raw`
Raw MoMo SMS before parsing.

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions, nullable until mapped)
- `sender_phone` (text)
- `sms_text` (text)
- `received_at` (timestamptz)
- `source` (enum: android_gateway | manual_import)
- `hash` (text, unique) - SHA256 for deduplication
- `parse_status` (enum: pending | success | error)
- `parse_error` (text)
- `created_at` (timestamptz)

### `transactions`
Unified transaction ledger (created ONLY from SMS parsing).

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `momo_sms_id` (uuid, FK → momo_sms_raw)
- `member_id` (uuid, FK → members, nullable if unallocated)
- `group_id` (uuid, FK → groups, nullable if unallocated)
- `type` (text: CONTRIBUTION | PAYMENT | ...)
- `amount` (numeric)
- `currency` (text, default: 'RWF')
- `channel` (text: MoMo | Cash | ...)
- `status` (enum: COMPLETED | PENDING | FAILED | REVERSED)
- `reference` (text)
- `occurred_at` (timestamptz) - actual transaction time
- `payer_phone` (text)
- `payer_name` (text, nullable)
- `momo_ref` (text)
- `parse_confidence` (numeric, 0.0-1.0)
- `allocation_status` (enum: unallocated | allocated | error | duplicate | reversed)
- `created_at` (timestamptz)

**Business Rules:**
- Transactions can ONLY be created via `parse_momo_sms()` function (enforced by RLS)
- `allocation_status='unallocated'` → `member_id` and `group_id` must be NULL
- `allocation_status='allocated'` → `member_id` and `group_id` must be set
- Staff can only allocate existing transactions (cannot edit transaction facts)

### `transaction_allocations`
Audit trail of allocations.

**Columns:**
- `id` (uuid, PK)
- `transaction_id` (uuid, FK → transactions)
- `member_id` (uuid, FK → members)
- `group_id` (uuid, FK → groups)
- `allocated_by` (uuid, FK → auth.users)
- `allocated_at` (timestamptz)
- `notes` (text, nullable)

## Reconciliation

### `reconciliation_sessions`
Work sessions opened by staff for reconciliation.

**Columns:**
- `id` (uuid, PK)
- `institution_id` (uuid, FK → institutions)
- `opened_by` (uuid, FK → auth.users)
- `opened_at` (timestamptz)
- `closed_at` (timestamptz, nullable)
- `status` (enum: open | resolved | closed)
- `notes` (text, nullable)

### `reconciliation_items`
Individual issues within a session.

**Columns:**
- `id` (uuid, PK)
- `session_id` (uuid, FK → reconciliation_sessions)
- `transaction_id` (uuid, FK → transactions, nullable)
- `issue_type` (enum: duplicate | parse_failure | momo_code_mismatch | amount_mismatch | phone_mismatch)
- `resolution` (text, nullable)
- `resolved_by` (uuid, FK → auth.users, nullable)
- `resolved_at` (timestamptz, nullable)
- `metadata` (jsonb)

## Audit & Logging

### `audit_log`
System-wide audit trail.

**Columns:**
- `id` (uuid, PK)
- `actor_user_id` (uuid, FK → auth.users)
- `institution_id` (uuid, FK → institutions, nullable)
- `action` (text) - e.g., 'allocate_transaction', 'create_group', 'import_members'
- `entity_type` (text) - e.g., 'transaction', 'member', 'group'
- `entity_id` (uuid, nullable)
- `metadata` (jsonb)
- `created_at` (timestamptz)

## Other Tables (Kept)

- `meetings` - Group meetings (optional, not core to MVP)
- `loans` - Member loans (optional, not core to MVP)
- `withdrawals` - Withdrawal requests (optional)
- `branches` - Institution branches
- `settings` - Institution settings

## Database Functions

### `parse_momo_sms()`
Parses SMS and creates transaction. Called by Edge Function.

**Parameters:**
- `p_sms_id`, `p_institution_id`, `p_amount`, `p_currency`, `p_payer_phone`, `p_payer_name`, `p_momo_ref`, `p_occurred_at`, `p_parse_confidence`

**Returns:** `transaction_id` (uuid)

**Behavior:**
- Creates transaction with status='unallocated' or 'allocated' (if phone matches member)
- Updates SMS parse_status
- Creates allocation record if auto-matched
- Writes audit log

### `allocate_transaction()`
Allocates an unallocated transaction to a member.

**Parameters:**
- `p_transaction_id`, `p_member_id`

**Returns:** `allocation_id` (uuid)

**Behavior:**
- Validates transaction is unallocated
- Validates member belongs to same institution
- Updates transaction (sets member_id, group_id, allocation_status='allocated')
- Creates allocation record
- Writes audit log

## RLS Policies

All tables use institution-scoped RLS:

```sql
USING (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
)
```

**Admin:** Sees all institutions (global visibility)
**Staff:** Sees only their institution

## Indexes

All foreign keys, `institution_id`, and frequently queried columns are indexed:
- `idx_*_institution_id` on all tables
- `idx_transactions_allocation_status` (partial: unallocated only)
- `idx_momo_sms_raw_parse_status`
- `idx_transactions_occurred_at`
- `idx_audit_log_created_at`

## Constraints

1. **member.institution_id == group.institution_id** - Enforced by trigger `check_member_group_institution`
2. **Transactions can only be created via parse_momo_sms()** - Enforced by RLS (only function has INSERT permission)
3. **Unallocated transactions cannot have member_id/group_id** - Enforced by allocation_status check
4. **MoMo code deduplication** - Unique hash on `momo_sms_raw`


