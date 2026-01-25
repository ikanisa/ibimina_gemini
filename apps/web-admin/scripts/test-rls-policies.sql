-- RLS Policy Testing Script
-- This script helps verify that Row Level Security policies are working correctly

-- Test 1: Verify Platform Admin can see all institutions
SET ROLE authenticated;
SET request.jwt.claim.role = 'PLATFORM_ADMIN';
SELECT COUNT(*) as platform_admin_institution_count FROM institutions;

-- Test 2: Verify Regular User can only see their institution
SET ROLE authenticated;
SET request.jwt.claim.role = 'INSTITUTION_ADMIN';
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_institution_count FROM institutions;
-- Should return 1 or 0, not all institutions

-- Test 3: Verify Groups RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_groups_count FROM groups;
-- Should only return groups for the user's institution

-- Test 4: Verify Members RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_members_count FROM members;
-- Should only return members for the user's institution

-- Test 5: Verify Transactions RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_transactions_count FROM transactions;
-- Should only return transactions for the user's institution

-- Test 6: Verify Profiles RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_profiles_count FROM profiles;
-- Should only return profiles for the user's institution

-- Test 7: Verify Audit Log RLS (Platform Admin should see all)
SET ROLE authenticated;
SET request.jwt.claim.role = 'PLATFORM_ADMIN';
SELECT COUNT(*) as platform_admin_audit_count FROM audit_log;

-- Test 8: Verify Audit Log RLS (Regular User should see only their institution)
SET ROLE authenticated;
SET request.jwt.claim.role = 'INSTITUTION_ADMIN';
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_audit_count FROM audit_log;
-- Should only return audit logs for the user's institution

-- Test 9: Verify Settings RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_settings_count FROM settings;
-- Should only return settings for the user's institution

-- Test 10: Verify SMS Gateway Devices RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT COUNT(*) as user_devices_count FROM sms_gateway_devices;
-- Should only return devices for the user's institution

-- Test 11: Test Cross-Institution Access Prevention
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'institution-a';
-- Try to access data from institution-b
SELECT * FROM groups WHERE institution_id = 'institution-b';
-- Should return empty or error

-- Test 12: Verify RPC Functions Respect RLS
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT * FROM get_dashboard_summary('test-institution-id', 7);
-- Should only return data for the user's institution

-- Test 13: Verify Edge Function Access
-- Note: Edge Functions should check permissions in code
-- Test by calling Edge Functions with different user roles

-- Test 14: Verify Anonymous Access is Blocked
SET ROLE anon;
SELECT * FROM institutions;
-- Should return error or empty

-- Test 15: Verify Service Role Bypasses RLS (for admin operations)
SET ROLE service_role;
SELECT COUNT(*) as service_role_count FROM institutions;
-- Should return all institutions (service role bypasses RLS)
