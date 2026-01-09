# Code Updates After Aggressive Consolidation

## ✅ Completed Updates

### 1. ParsingSettings.tsx
- ✅ Changed from `institution_settings` table to `institutions` table
- ✅ Updated `loadSettings()` to query `institutions` instead
- ✅ Updated `saveSettings()` to update `institutions` directly (removed RPC dependency)

### 2. groups.api.ts
- ✅ Updated `fetchGroupsWithMemberCounts()` to use `groups.members` JSONB array
- ✅ Updated `fetchGroupMembers()` to extract from `groups.members` JSONB and fetch member details
- ✅ Updated `fetchGroupMeetings()` to return empty array (meetings table deleted)
- ✅ Updated `fetchGroupContributions()` to use `transactions` table instead of `contributions`

### 3. Groups.tsx
- ✅ Updated `loadGroupDetails()` to fetch from `groups.members` JSONB instead of `group_members` table
- ✅ Removed `meetings` query (table deleted)
- ✅ Updated to handle members from JSONB array

### 4. InstitutionDrawer.tsx
- ✅ Removed `branches` tab completely
- ✅ Removed `loadBranches()` function
- ✅ Removed all branches-related state and UI
- ✅ Removed `GitBranch` icon import

---

## ⚠️ Remaining Tasks

### 1. Database RPC Functions
The `update_institution_settings` RPC function in `supabase/migrations/20260107100000_settings_module.sql` should be updated or removed since we're now updating `institutions` directly.

**Action:** Either:
- Update the RPC to update `institutions` table, OR
- Remove the RPC and use direct table updates (already done in ParsingSettings.tsx)

### 2. Other Files to Check
Search for any remaining references to:
- `group_members` table
- `institution_settings` table
- `reconciliation_items` table
- `branches` table
- `loans` table
- `meetings` table
- `payers` table

### 3. Type Definitions
Update TypeScript types in `types.ts` if needed:
- Remove `SupabaseBranch` interface (if exists)
- Update `SupabaseGroup` to include `members?: jsonb` field
- Update `SupabaseReconciliationSession` to include `items?: jsonb` field

---

## Migration Status

**Migration File:** `supabase/migrations/20260110000003_aggressive_consolidation.sql`

**Status:** Ready to apply via Supabase Dashboard

**Instructions:** See `docs/audit/APPLY_CONSOLIDATION.md`

---

## Testing Checklist

After applying migration and code updates:

- [ ] Parsing settings page loads and saves correctly
- [ ] Groups page displays member counts correctly
- [ ] Group details show members from JSONB array
- [ ] Institution drawer no longer shows branches tab
- [ ] No console errors related to deleted tables
- [ ] All queries use new table structure
