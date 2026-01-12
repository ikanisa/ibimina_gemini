-- ============================================================================
-- Comprehensive RLS Security Tests
-- Date: 2026-01-14
-- Purpose: Test all RLS policies with different roles
-- ============================================================================

-- IMPORTANT: 
-- 1. Replace placeholders with actual user IDs and institution IDs
-- 2. Run these tests as different users (use SET ROLE or connect as different users)
-- 3. Verify expected results match actual results

-- ============================================================================
-- HELPER: Get test user IDs and institution IDs
-- ============================================================================

-- Get Platform Admin user ID
-- SELECT user_id FROM profiles WHERE role = 'PLATFORM_ADMIN' LIMIT 1;

-- Get Institution A Admin user ID
-- SELECT user_id, institution_id FROM profiles WHERE role = 'INSTITUTION_ADMIN' AND institution_id = 'INSTITUTION_A_ID' LIMIT 1;

-- Get Institution B Admin user ID
-- SELECT user_id, institution_id FROM profiles WHERE role = 'INSTITUTION_ADMIN' AND institution_id = 'INSTITUTION_B_ID' LIMIT 1;

-- ============================================================================
-- TEST 1: Platform Admin Access
-- ============================================================================

-- Expected: Platform Admin should see ALL institutions
-- Run as: Platform Admin user
SELECT 
  'Platform Admin Institutions' as test_name,
  COUNT(*) as institution_count
FROM institutions;
-- Expected: Should return count of ALL institutions

-- Expected: Platform Admin should see ALL groups
SELECT 
  'Platform Admin Groups' as test_name,
  COUNT(*) as group_count
FROM groups;
-- Expected: Should return count of ALL groups

-- Expected: Platform Admin should see ALL members
SELECT 
  'Platform Admin Members' as test_name,
  COUNT(*) as member_count
FROM members;
-- Expected: Should return count of ALL members

-- Expected: Platform Admin should see ALL transactions
SELECT 
  'Platform Admin Transactions' as test_name,
  COUNT(*) as transaction_count
FROM transactions;
-- Expected: Should return count of ALL transactions

-- ============================================================================
-- TEST 2: Institution Admin Access (Institution A)
-- ============================================================================

-- Expected: Institution Admin should see ONLY their institution
-- Run as: Institution A Admin user
SELECT 
  'Institution A Admin Institutions' as test_name,
  COUNT(*) as institution_count
FROM institutions;
-- Expected: Should return 1 (their institution only)

-- Expected: Institution Admin should see ONLY their institution's groups
SELECT 
  'Institution A Admin Groups' as test_name,
  COUNT(*) as group_count,
  COUNT(DISTINCT institution_id) as institution_count
FROM groups;
-- Expected: Should return groups from Institution A only, institution_count = 1

-- Expected: Institution Admin should see ONLY their institution's members
SELECT 
  'Institution A Admin Members' as test_name,
  COUNT(*) as member_count,
  COUNT(DISTINCT institution_id) as institution_count
FROM members;
-- Expected: Should return members from Institution A only, institution_count = 1

-- Expected: Institution Admin should see ONLY their institution's transactions
SELECT 
  'Institution A Admin Transactions' as test_name,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT institution_id) as institution_count
FROM transactions;
-- Expected: Should return transactions from Institution A only, institution_count = 1

-- ============================================================================
-- TEST 3: Cross-Institution Access Prevention
-- ============================================================================

-- Expected: Institution A Admin should NOT see Institution B's groups
-- Run as: Institution A Admin user
SELECT 
  'Cross-Institution Groups Test' as test_name,
  COUNT(*) as institution_b_groups
FROM groups
WHERE institution_id = 'INSTITUTION_B_ID'::uuid;
-- Expected: Should return 0 (no access to Institution B)

-- Expected: Institution A Admin should NOT see Institution B's members
SELECT 
  'Cross-Institution Members Test' as test_name,
  COUNT(*) as institution_b_members
FROM members
WHERE institution_id = 'INSTITUTION_B_ID'::uuid;
-- Expected: Should return 0 (no access to Institution B)

-- Expected: Institution A Admin should NOT see Institution B's transactions
SELECT 
  'Cross-Institution Transactions Test' as test_name,
  COUNT(*) as institution_b_transactions
FROM transactions
WHERE institution_id = 'INSTITUTION_B_ID'::uuid;
-- Expected: Should return 0 (no access to Institution B)

-- ============================================================================
-- TEST 4: Staff Permissions (View Only)
-- ============================================================================

-- Expected: Staff can view data
-- Run as: Institution A Staff user
SELECT 
  'Staff View Groups' as test_name,
  COUNT(*) as group_count
FROM groups;
-- Expected: Should return groups from Institution A

-- Expected: Staff can create data
-- Run as: Institution A Staff user
-- INSERT INTO groups (institution_id, group_name, status, expected_amount, frequency, currency)
-- VALUES ('INSTITUTION_A_ID'::uuid, 'Test Group', 'ACTIVE', 10000, 'Monthly', 'RWF');
-- Expected: Should succeed

-- Expected: Staff CANNOT delete members (only admins can)
-- Run as: Institution A Staff user
-- DELETE FROM members WHERE id = 'SOME_MEMBER_ID'::uuid;
-- Expected: Should fail with permission error

-- ============================================================================
-- TEST 5: Profile Access
-- ============================================================================

-- Expected: User can view their own profile
-- Run as: Any authenticated user
SELECT 
  'Own Profile Access' as test_name,
  COUNT(*) as own_profile_count
FROM profiles
WHERE user_id = auth.uid();
-- Expected: Should return 1 (their own profile)

-- Expected: Institution Admin can view profiles in their institution
-- Run as: Institution A Admin user
SELECT 
  'Institution Profiles Access' as test_name,
  COUNT(*) as institution_profiles_count
FROM profiles
WHERE institution_id = auth.user_institution_id();
-- Expected: Should return profiles from Institution A

-- Expected: Staff CANNOT view profiles from other institutions
-- Run as: Institution A Staff user
SELECT 
  'Cross-Institution Profiles Test' as test_name,
  COUNT(*) as other_institution_profiles
FROM profiles
WHERE institution_id = 'INSTITUTION_B_ID'::uuid;
-- Expected: Should return 0 (no access)

-- ============================================================================
-- TEST 6: Settings Access
-- ============================================================================

-- Expected: Staff can view settings for their institution
-- Run as: Institution A Staff user
SELECT 
  'Staff View Settings' as test_name,
  COUNT(*) as settings_count
FROM settings
WHERE institution_id = auth.user_institution_id();
-- Expected: Should return settings from Institution A

-- Expected: Staff CANNOT update settings (only admins can)
-- Run as: Institution A Staff user
-- UPDATE settings SET value = 'test' WHERE institution_id = auth.user_institution_id();
-- Expected: Should fail with permission error

-- Expected: Admin CAN update settings
-- Run as: Institution A Admin user
-- UPDATE settings SET value = 'test' WHERE institution_id = auth.user_institution_id();
-- Expected: Should succeed

-- ============================================================================
-- TEST 7: Audit Logs Access
-- ============================================================================

-- Expected: Only admins can view audit logs
-- Run as: Institution A Admin user
SELECT 
  'Admin View Audit Logs' as test_name,
  COUNT(*) as audit_log_count
FROM audit_logs;
-- Expected: Should return audit logs (admin can view)

-- Expected: Staff CANNOT view audit logs
-- Run as: Institution A Staff user
SELECT 
  'Staff View Audit Logs' as test_name,
  COUNT(*) as audit_log_count
FROM audit_logs;
-- Expected: Should return 0 (staff cannot view)

-- ============================================================================
-- TEST 8: Transaction Permissions
-- ============================================================================

-- Expected: Staff can create transactions
-- Run as: Institution A Staff user
-- INSERT INTO transactions (institution_id, occurred_at, amount, currency, type, channel, status, allocation_status)
-- VALUES ('INSTITUTION_A_ID'::uuid, NOW(), 1000, 'RWF', 'CONTRIBUTION', 'MOMO', 'COMPLETED', 'unallocated');
-- Expected: Should succeed

-- Expected: Staff CANNOT update transactions (only admins can)
-- Run as: Institution A Staff user
-- UPDATE transactions SET status = 'REVERSED' WHERE id = 'SOME_TRANSACTION_ID'::uuid;
-- Expected: Should fail with permission error

-- Expected: Admin CAN update transactions
-- Run as: Institution A Admin user
-- UPDATE transactions SET status = 'REVERSED' WHERE id = 'SOME_TRANSACTION_ID'::uuid;
-- Expected: Should succeed

-- ============================================================================
-- TEST 9: Member Permissions
-- ============================================================================

-- Expected: Staff can create members
-- Run as: Institution A Staff user
-- INSERT INTO members (institution_id, full_name, phone, status)
-- VALUES ('INSTITUTION_A_ID'::uuid, 'Test Member', '+250788000000', 'ACTIVE');
-- Expected: Should succeed

-- Expected: Staff can update members
-- Run as: Institution A Staff user
-- UPDATE members SET full_name = 'Updated Name' WHERE id = 'SOME_MEMBER_ID'::uuid;
-- Expected: Should succeed

-- Expected: Staff CANNOT delete members (only admins can)
-- Run as: Institution A Staff user
-- DELETE FROM members WHERE id = 'SOME_MEMBER_ID'::uuid;
-- Expected: Should fail with permission error

-- ============================================================================
-- TEST 10: RPC Function Security
-- ============================================================================

-- Expected: RPC functions respect RLS
-- Run as: Institution A Admin user
SELECT * FROM get_report_summary(
  'institution'::text,
  'INSTITUTION_A_ID'::uuid,
  NOW() - interval '30 days',
  NOW(),
  NULL
);
-- Expected: Should return data for Institution A only

-- Expected: RPC functions block cross-institution access
-- Run as: Institution A Admin user
SELECT * FROM get_report_summary(
  'institution'::text,
  'INSTITUTION_B_ID'::uuid, -- Trying to access Institution B
  NOW() - interval '30 days',
  NOW(),
  NULL
);
-- Expected: Should fail or return empty (no access to Institution B)

-- ============================================================================
-- TEST 11: Unauthenticated Access
-- ============================================================================

-- Expected: Unauthenticated users cannot access data
-- Run as: Anonymous (no auth)
-- SELECT * FROM institutions;
-- Expected: Should fail with authentication error

-- SELECT * FROM groups;
-- Expected: Should fail with authentication error

-- SELECT * FROM members;
-- Expected: Should fail with authentication error

-- ============================================================================
-- SUMMARY: Verify RLS is Enabled
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'institutions', 'groups', 'members', 'transactions', 
    'profiles', 'settings', 'audit_logs', 'contributions',
    'sms_messages', 'sms_gateway_devices'
  )
ORDER BY tablename;

-- Expected: All tables should have rowsecurity = true

-- ============================================================================
-- SUMMARY: List All RLS Policies
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Should list all RLS policies for each table
