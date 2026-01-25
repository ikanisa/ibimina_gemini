# Groups & Members Module Implementation Report

## Phase 5: Groups & Members (Wizard + Bulk Upload)

**Date:** January 7, 2026  
**Status:** ✅ Implemented

---

## Overview

Implemented Groups and Members management with wizard onboarding and CSV bulk import. The implementation is minimalist but robust, with DB-enforced business rules ensuring clean data for Transactions/Reconciliation allocation.

---

## Inventory (Pre-Implementation Audit)

### Existing Tables (Extended)
- `groups` - Added `group_code`, `description` columns
- `members` - Added `member_code`, `phone_alt` columns; `group_id` already existed
- `group_members` - Junction table for backward compatibility

### Existing Components (Reused)
- `Groups.tsx` - List view with stats, modal for create
- `Members.tsx` - List view with detail drawer
- `BulkGroupUpload.tsx` - AI/OCR based (kept as alternative)
- `BulkMemberUpload.tsx` - Existing bulk upload

---

## Backend Implementation

### Migration: `20260107500000_groups_members_module.sql`

#### 1. Columns Added
```sql
-- Groups
group_code text  -- Unique per institution

-- Members  
member_code text -- Unique per institution
phone_alt text   -- Alternative phone
```

#### 2. Unique Constraints
```sql
-- Unique group_code per institution (allows nulls)
idx_groups_institution_group_code

-- Unique member_code per institution (allows nulls)
idx_members_institution_member_code
```

#### 3. Indexes Added
```sql
-- Groups
idx_groups_institution_name
idx_groups_institution_created
idx_groups_institution_status

-- Members
idx_members_institution_group
idx_members_institution_phone
idx_members_institution_name
idx_members_institution_created
```

#### 4. Institution Enforcement Trigger
```sql
CREATE FUNCTION enforce_member_group_institution()
-- Validates member.institution_id == group.institution_id
-- Rejects inserts/updates if mismatch
```

#### 5. RPCs Created

| Function | Parameters | Returns | Purpose |
|----------|------------|---------|---------|
| `create_group` | institution_id, name, group_code, meeting_day, frequency, expected_amount | uuid | Create group with audit |
| `update_group` | group_id, name, group_code, status, meeting_day, expected_amount | void | Update with deactivation check |
| `bulk_import_groups` | institution_id, rows jsonb | jsonb | Upsert groups, returns row-level results |
| `create_member` | institution_id, group_id, full_name, member_code, phone_primary, phone_alt | uuid | Create member with group validation |
| `update_member` | member_id, full_name, phone_primary, phone_alt, status, group_id | void | Update with group transfer |
| `bulk_import_members` | institution_id, rows jsonb | jsonb | Upsert members, resolves group_code |
| `transfer_member_group` | member_id, new_group_id, note | void | Transfer with audit |

All RPCs:
- Validate authentication
- Check institution access (RLS-aware)
- Prevent deactivating groups with active members
- Write to `audit_log`

---

## Frontend Implementation

### Group Components

| Component | Path | Purpose |
|-----------|------|---------|
| `GroupWizard` | `components/groups/GroupWizard.tsx` | 2-step wizard (Details → Review) |
| `BulkGroupImport` | `components/groups/BulkGroupImport.tsx` | CSV-based import (Upload → Preview → Import) |

#### GroupWizard Features
- Auto-generates group_code if blank
- Validates required name
- Shows review summary before create
- Calls `create_group` RPC

#### BulkGroupImport Features
- Downloadable CSV template
- Client-side CSV parsing
- Row-level validation preview
- Shows valid/invalid counts
- Calls `bulk_import_groups` RPC
- Returns inserted/updated/failed counts

### Member Components

| Component | Path | Purpose |
|-----------|------|---------|
| `MemberWizard` | `components/members/MemberWizard.tsx` | 3-step wizard (Identity → Group → Review) |
| `BulkMemberImport` | `components/members/BulkMemberImport.tsx` | CSV-based import with group resolution |

#### MemberWizard Features
- Auto-generates member_code if blank
- Phone format validation
- Group search and selection (optional)
- Prefill support for phone/group from other pages
- Calls `create_member` RPC

#### BulkMemberImport Features
- Downloadable CSV template
- Shows available group_codes for reference
- Validates group_code exists before import
- Warns (soft) on duplicate phone numbers
- Calls `bulk_import_members` RPC

### CSV Templates

**groups_template.csv:**
```csv
name,group_code
Ibimina y'Urubyiruko,IBY-001
Twisungane Savings,TWS-001
```

**members_template.csv:**
```csv
full_name,member_code,phone_primary,phone_alt,group_code
Jean Pierre Habimana,M-JPH001,0788123456,,IBY-001
Marie Claire Uwimana,M-MCU002,0788654321,0789111222,TWS-001
```

---

## Business Rules (DB-Enforced)

| Rule | Enforcement |
|------|-------------|
| Group belongs to one institution | FK constraint |
| Member belongs to one institution | FK constraint |
| Member's group must be in same institution | Trigger: `enforce_member_group_institution` |
| Unique group_code per institution | Unique index |
| Unique member_code per institution | Unique index |
| Cannot deactivate group with active members | `update_group` RPC validation |

---

## Seed Data

### File: `supabase/seed/010_groups_members_demo_data.sql`

| Entity | Count | Details |
|--------|-------|---------|
| Groups | 12 | GRP-001 to GRP-012, mixed meeting days/frequencies |
| Members | 130 | 120 with groups (M-0001 to M-0120), 10 unassigned (M-UN001 to M-UN010) |
| Roles | Mixed | Chairperson, Treasurer, Secretary, Member |
| Statuses | Mixed | ACTIVE, INACTIVE, SUSPENDED |

---

## Integration Points

### From Reconciliation
- "Create Member" shortcut can prefill phone + group via `MemberWizard` props

### To Transactions/Reconciliation
- Clean member data (unique codes, validated phones) enables reliable allocation
- Group memberships properly tracked for reporting

---

## Files Changed

### New Files
- `supabase/migrations/20260107500000_groups_members_module.sql`
- `components/groups/GroupWizard.tsx`
- `components/groups/BulkGroupImport.tsx`
- `components/groups/index.ts`
- `components/members/MemberWizard.tsx`
- `components/members/BulkMemberImport.tsx`
- `components/members/index.ts`
- `supabase/seed/010_groups_members_demo_data.sql`

### Existing Files (No Changes Needed)
- `Groups.tsx` - Already has modal integration points
- `Members.tsx` - Already has modal integration points

---

## Testing Recommendations

### Playwright Tests to Add
1. Staff sees only their institution's groups/members
2. Create group wizard completes successfully
3. Create member wizard completes successfully
4. Bulk import rejects invalid rows, imports valid ones
5. Institution enforcement trigger prevents cross-institution group assignment
6. Audit log created for each create/update/import action

---

## Next Steps
1. Deploy migration with `supabase db push`
2. Run seed data
3. Test wizards and bulk imports
4. Add Playwright tests
5. Integrate MemberWizard prefill from Reconciliation page

