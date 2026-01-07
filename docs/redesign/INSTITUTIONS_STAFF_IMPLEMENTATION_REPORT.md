# Phase 7: Institutions + Staff/User Management Implementation Report

## Overview

Phase 7 implements the admin control plane for institution and staff/user management. This is the foundation for multi-tenant scoping across the entire system.

## Summary of Changes

### 1. Database Schema (Migration)

**File:** `supabase/migrations/20260107700000_institutions_staff_module.sql`

#### Tables Modified

- **`profiles`**
  - Added `is_active` boolean column for soft-delete/deactivation
  - Added indexes for `institution_id`, `role`, and `is_active`

- **`institutions`**
  - Added `contact_email`, `contact_phone`, and `region` columns

#### New Tables

- **`staff_invites`**
  - Tracks auditable staff invitations
  - Fields: `id`, `email`, `institution_id`, `role`, `status`, `invited_by`, `accepted_by`, `created_at`, `accepted_at`, `expires_at`, `metadata`
  - Status enum: `pending`, `accepted`, `expired`, `revoked`
  - RLS policies for PLATFORM_ADMIN and INSTITUTION_ADMIN

#### RPC Functions Implemented

| Function | Purpose | Access |
|----------|---------|--------|
| `create_institution` | Create new institution with optional MoMo code | PLATFORM_ADMIN only |
| `update_institution` | Update institution details, enforce MoMo code for activation | PLATFORM_ADMIN or INSTITUTION_ADMIN (own) |
| `update_staff_role` | Change staff member's role | PLATFORM_ADMIN or INSTITUTION_ADMIN (own institution, with restrictions) |
| `deactivate_staff` | Deactivate a staff member (blocks login) | PLATFORM_ADMIN or INSTITUTION_ADMIN (own institution) |
| `reactivate_staff` | Reactivate a deactivated staff member | PLATFORM_ADMIN or INSTITUTION_ADMIN (own institution) |
| `reassign_staff_institution` | Move staff to different institution | PLATFORM_ADMIN only |
| `create_staff_invite` | Create invitation record | PLATFORM_ADMIN or INSTITUTION_ADMIN (own institution) |
| `revoke_staff_invite` | Cancel pending invitation | PLATFORM_ADMIN or INSTITUTION_ADMIN (own institution) |
| `get_institution_staff_count` | Helper for counts | Authenticated |
| `get_institution_groups_count` | Helper for counts | Authenticated |
| `get_institution_members_count` | Helper for counts | Authenticated |

#### RLS Policies

- **Staff Invites**: PLATFORM_ADMIN full access, INSTITUTION_ADMIN access to own institution only
- **Profiles**: Updated to scope staff list visibility by institution

#### Business Rules Enforced

1. Only PLATFORM_ADMIN can create institutions
2. Cannot activate institution without primary MoMo code
3. Suspending an institution automatically deactivates all staff
4. INSTITUTION_ADMIN cannot promote to PLATFORM_ADMIN
5. INSTITUTION_ADMIN cannot demote another INSTITUTION_ADMIN
6. Cannot deactivate your own account
7. Cannot reassign PLATFORM_ADMIN to an institution
8. Cannot reactivate staff if institution is suspended
9. All admin actions logged to `audit_log`

### 2. Edge Function Updates

**File:** `supabase/functions/staff-invite/index.ts`

- Already integrated with `staff_invites` table
- Creates invite record before user creation
- Writes to `audit_log` on successful invite
- Updates invite status on success/failure

### 3. Frontend Components

**New Directory:** `components/institutions/`

#### `Institutions.tsx`
- Main page with lazy-loading list of institutions
- Search and filter by type/status
- Card-based display with key info (type, status, staff count, MoMo code)
- Warning indicator for missing MoMo code
- Create button (PLATFORM_ADMIN only)

#### `InstitutionDrawer.tsx`
- Detail drawer with 4 tabs:
  - **Overview**: Institution details with edit mode
  - **MoMo Codes**: List codes, add new, set primary
  - **Staff**: List staff with deactivate/reactivate actions
  - **Directory**: Counts for groups, members, staff

#### `CreateInstitutionDrawer.tsx`
- Form to create new institution
- All fields including optional primary MoMo code
- Calls `create_institution` RPC

### 4. Navigation & Routing

**File:** `App.tsx`

- Added `ViewState.INSTITUTIONS` to enum
- Added lazy import for `Institutions` component
- Added "Institutions" nav item in sidebar (System section)
- Added access control (PLATFORM_ADMIN only currently mapped to 'Super Admin')
- Added header title for Institutions view

**File:** `types.ts`

- Added `INSTITUTIONS = 'INSTITUTIONS'` to `ViewState` enum

### 5. Seed Data

**File:** `supabase/seed/012_institutions_staff_demo_data.sql`

- 2 active demo institutions (Umwalimu SACCO Demo, Kigali MFI Demo)
- 1 suspended institution for testing
- MoMo codes (primary + secondary) for active institutions
- Staff invite examples (pending, expired, revoked)
- Institution settings records
- SMS sources for institutions
- Audit log entries for demo actions

## File Inventory

| File | Status | Purpose |
|------|--------|---------|
| `supabase/migrations/20260107700000_institutions_staff_module.sql` | Existing | Schema + RPCs |
| `components/institutions/index.ts` | **New** | Barrel export |
| `components/institutions/Institutions.tsx` | **New** | Main list page |
| `components/institutions/InstitutionDrawer.tsx` | **New** | Detail drawer |
| `components/institutions/CreateInstitutionDrawer.tsx` | **New** | Create form drawer |
| `supabase/seed/012_institutions_staff_demo_data.sql` | **New** | Demo data |
| `App.tsx` | Modified | Navigation + routing |
| `types.ts` | Modified | ViewState enum |

## Permission Matrix

| Action | PLATFORM_ADMIN | INSTITUTION_ADMIN | STAFF |
|--------|---------------|-------------------|-------|
| View all institutions | ✅ | ❌ (own only) | ❌ |
| Create institution | ✅ | ❌ | ❌ |
| Edit institution | ✅ | ✅ (own only) | ❌ |
| Suspend institution | ✅ | ❌ | ❌ |
| Add MoMo code | ✅ | ✅ (own only) | ❌ |
| Set primary MoMo | ✅ | ✅ (own only) | ❌ |
| View staff list | ✅ | ✅ (own institution) | ❌ |
| Invite staff | ✅ | ✅ (own institution) | ❌ |
| Update staff role | ✅ | ✅ (restricted) | ❌ |
| Deactivate staff | ✅ | ✅ (own institution) | ❌ |
| Reassign staff | ✅ | ❌ | ❌ |

## Testing Checklist

### Backend (SQL/RPC)

- [ ] `create_institution` creates institution and optional MoMo code
- [ ] `create_institution` rejected for non-PLATFORM_ADMIN
- [ ] `update_institution` rejects activation without MoMo code
- [ ] `update_institution` cascades deactivation on suspend
- [ ] `update_staff_role` validates role assignments
- [ ] `deactivate_staff` blocks self-deactivation
- [ ] `reactivate_staff` checks institution status
- [ ] `reassign_staff_institution` PLATFORM_ADMIN only
- [ ] All RPC functions write to `audit_log`

### Frontend

- [ ] Institutions list loads with lazy loading
- [ ] Search filters correctly
- [ ] Type and status filters work
- [ ] Create drawer opens for PLATFORM_ADMIN
- [ ] Create saves institution via RPC
- [ ] Detail drawer opens on card click
- [ ] Edit mode works in Overview tab
- [ ] MoMo codes tab loads and displays codes
- [ ] Add MoMo code works
- [ ] Set primary MoMo code works
- [ ] Staff tab shows institution staff
- [ ] Deactivate/Reactivate staff works
- [ ] Directory tab shows correct counts

### E2E (Playwright)

- [ ] PLATFORM_ADMIN can access /institutions
- [ ] INSTITUTION_ADMIN cannot access /institutions (redirected or 403)
- [ ] Creating institution appears in list
- [ ] Setting MoMo code updates display
- [ ] Staff deactivation reflects in list

## Deployment Steps

1. Push migration:
   ```bash
   supabase db push --linked
   ```

2. Deploy edge functions:
   ```bash
   supabase functions deploy staff-invite --no-verify-jwt
   ```

3. Run seed data (optional):
   ```bash
   supabase db reset  # or manually execute seed SQL
   ```

4. Verify in Supabase dashboard:
   - Check `staff_invites` table exists
   - Check RPC functions are deployed
   - Check RLS policies are active

## Notes

- The existing `Saccos.tsx` component remains for backward compatibility; `Institutions.tsx` provides the new admin-focused view
- Role mapping uses 'Super Admin' in mock mode for PLATFORM_ADMIN; in real mode, it checks `role` from `useAuth()`
- All drawer components use slide-in-from-right animation for consistency
- Lazy loading uses Intersection Observer for infinite scroll pattern

