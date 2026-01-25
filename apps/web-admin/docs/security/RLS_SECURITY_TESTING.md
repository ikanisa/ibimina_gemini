# RLS Security Testing Guide

**Date:** 2026-01-14  
**Purpose:** Comprehensive guide for testing Row Level Security (RLS) policies with different user roles

---

## Overview

This document provides a comprehensive guide for testing the application's Row Level Security (RLS) policies to ensure proper data isolation and access control across different user roles and institutions.

---

## User Roles

### 1. PLATFORM_ADMIN (Super Admin)

**Permissions:**
- ✅ Access ALL institutions
- ✅ Access ALL data across institutions
- ✅ Manage all settings
- ✅ View all audit logs
- ✅ Bypass institution scoping

**Test Focus:**
- Verify can access all institutions
- Verify can see cross-institution data
- Verify can manage platform-wide settings

---

### 2. INSTITUTION_ADMIN (Branch Manager)

**Permissions:**
- ✅ Access ONLY their institution
- ✅ Manage staff in their institution
- ✅ Update settings for their institution
- ✅ View audit logs for their institution
- ✅ Update/delete transactions
- ✅ Delete members

**Test Focus:**
- Verify institution scoping works
- Verify cannot access other institutions
- Verify admin permissions work

---

### 3. INSTITUTION_STAFF (Regular Staff)

**Permissions:**
- ✅ Access ONLY their institution
- ✅ View and create data
- ✅ Update members and groups
- ❌ Cannot delete members
- ❌ Cannot update transactions
- ❌ Cannot update settings
- ❌ Cannot view audit logs

**Test Focus:**
- Verify institution scoping works
- Verify create permissions work
- Verify delete restrictions work

---

### 4. INSTITUTION_TREASURER

**Permissions:**
- ✅ Access ONLY their institution
- ✅ View financial data
- ✅ View transactions
- ❌ Limited update permissions

**Test Focus:**
- Verify financial data access
- Verify update restrictions

---

### 5. INSTITUTION_AUDITOR

**Permissions:**
- ✅ Access ONLY their institution
- ✅ View audit logs
- ✅ View all data (read-only)
- ❌ Cannot modify data

**Test Focus:**
- Verify read-only access
- Verify audit log access

---

## Test Scenarios

### Scenario 1: Cross-Institution Access Prevention

**Purpose:** Verify users cannot access data from other institutions

**Test Steps:**
1. Log in as Institution A Admin
2. Try to access Institution B's groups
3. Try to access Institution B's members
4. Try to access Institution B's transactions

**Expected Results:**
- All queries should return empty or fail
- No data from Institution B should be visible

**SQL Test:**
```sql
-- Run as Institution A Admin
SELECT COUNT(*) FROM groups WHERE institution_id = 'INSTITUTION_B_ID';
-- Expected: 0
```

---

### Scenario 2: Platform Admin Access

**Purpose:** Verify Platform Admin can access all institutions

**Test Steps:**
1. Log in as Platform Admin
2. View all institutions
3. View groups from all institutions
4. View members from all institutions

**Expected Results:**
- Should see data from all institutions
- No institution scoping should apply

**SQL Test:**
```sql
-- Run as Platform Admin
SELECT COUNT(DISTINCT institution_id) FROM groups;
-- Expected: Count of all institutions
```

---

### Scenario 3: Role-Based Permissions

**Purpose:** Verify different roles have correct permissions

**Test Steps:**
1. Log in as Staff user
2. Try to create a member (should succeed)
3. Try to delete a member (should fail)
4. Try to update settings (should fail)
5. Log in as Admin user
6. Try to delete a member (should succeed)
7. Try to update settings (should succeed)

**Expected Results:**
- Staff can create but not delete
- Admin can create and delete
- Settings updates restricted to admins

---

### Scenario 4: Table-Level Security

**Purpose:** Verify RLS is enabled on all tables

**Test Steps:**
1. Check RLS status on all tables
2. Verify policies exist
3. Test access with different roles

**Expected Results:**
- All tables have RLS enabled
- Policies are correctly configured
- Access is properly restricted

**SQL Test:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('institutions', 'groups', 'members', 'transactions');
-- Expected: All should have rowsecurity = true
```

---

### Scenario 5: RPC Function Security

**Purpose:** Verify RPC functions respect RLS

**Test Steps:**
1. Log in as Institution A Admin
2. Call RPC function with Institution A ID (should succeed)
3. Call RPC function with Institution B ID (should fail or return empty)

**Expected Results:**
- RPC functions enforce institution scoping
- Cross-institution access is blocked

---

### Scenario 6: Edge Function Security

**Purpose:** Verify Edge Functions check permissions

**Test Steps:**
1. Call Edge Function as Staff user
2. Try to perform admin-only operation
3. Verify access is denied

**Expected Results:**
- Edge Functions check user permissions
- Unauthorized operations are blocked

---

### Scenario 7: Unauthenticated Access

**Purpose:** Verify unauthenticated users cannot access data

**Test Steps:**
1. Try to access data without authentication
2. Verify all queries fail

**Expected Results:**
- All queries should fail with authentication error
- No data should be accessible

---

## Testing Tools

### 1. Create Test Users

**File:** `scripts/create-test-users.sql`

**Usage:**
1. Create auth users in Supabase Dashboard
2. Get their user IDs
3. Update the SQL file with actual IDs
4. Run the script to create test profiles

---

### 2. Comprehensive RLS Tests

**File:** `scripts/comprehensive-rls-tests.sql`

**Usage:**
1. Replace placeholders with actual IDs
2. Run tests as different users
3. Verify expected results match actual results

---

### 3. Testing Script

**File:** `scripts/test-rls-security.sh`

**Usage:**
```bash
chmod +x scripts/test-rls-security.sh
./scripts/test-rls-security.sh
```

---

## Manual Testing Checklist

### Platform Admin Tests

- [ ] Can view all institutions
- [ ] Can view all groups
- [ ] Can view all members
- [ ] Can view all transactions
- [ ] Can access cross-institution data
- [ ] Can manage platform settings

### Institution Admin Tests

- [ ] Can view only their institution
- [ ] Cannot view other institutions
- [ ] Can manage staff in their institution
- [ ] Can update settings for their institution
- [ ] Can delete members
- [ ] Can update transactions

### Staff Tests

- [ ] Can view only their institution
- [ ] Cannot view other institutions
- [ ] Can create members
- [ ] Can update members
- [ ] Cannot delete members
- [ ] Cannot update transactions
- [ ] Cannot update settings
- [ ] Cannot view audit logs

### Cross-Institution Tests

- [ ] Institution A Admin cannot see Institution B data
- [ ] Institution B Admin cannot see Institution A data
- [ ] Staff from Institution A cannot see Institution B data
- [ ] All cross-institution queries return empty or fail

### Authentication Tests

- [ ] Unauthenticated users cannot access data
- [ ] All queries require authentication
- [ ] RLS policies are enforced

---

## Common Issues and Solutions

### Issue: Users Can See Other Institutions' Data

**Symptoms:**
- Institution A Admin can see Institution B data
- RLS policies not working

**Solutions:**
1. Verify RLS is enabled on tables
2. Check policies are correctly configured
3. Verify `auth.user_institution_id()` function works
4. Check user's `institution_id` in profiles table

---

### Issue: Platform Admin Cannot Access All Data

**Symptoms:**
- Platform Admin is scoped to one institution
- Cannot see cross-institution data

**Solutions:**
1. Verify Platform Admin has `institution_id = NULL`
2. Check RLS policies allow Platform Admin bypass
3. Verify `auth.is_admin()` function works
4. Check role is set to 'PLATFORM_ADMIN'

---

### Issue: Staff Can Delete Members

**Symptoms:**
- Staff users can delete members
- Should be restricted to admins only

**Solutions:**
1. Check DELETE policy on members table
2. Verify policy uses `auth.is_admin()`
3. Test with actual Staff user

---

### Issue: RPC Functions Don't Respect RLS

**Symptoms:**
- RPC functions return cross-institution data
- No institution scoping

**Solutions:**
1. Check RPC function implementation
2. Verify functions check user's institution
3. Add institution checks in RPC functions

---

## Success Criteria

✅ **All tests pass if:**
1. Platform Admin can access all institutions
2. Institution users can only access their institution
3. Cross-institution access is blocked
4. Role-based permissions work correctly
5. Unauthenticated access is blocked
6. RPC functions respect RLS
7. Edge Functions check permissions
8. All tables have RLS enabled
9. Policies are correctly configured

---

## Related Files

- `supabase/migrations/20260112000000_complete_rls_policies.sql` - RLS policies
- `scripts/create-test-users.sql` - Create test users
- `scripts/comprehensive-rls-tests.sql` - Comprehensive tests
- `scripts/test-rls-security.sh` - Testing script
- `docs/security/RLS_TEST_RESULTS.md` - Test results template

---

## Next Steps

After completing testing:
1. Document any security issues found
2. Fix RLS policy problems
3. Re-test after fixes
4. Update security documentation
5. Perform security audit
