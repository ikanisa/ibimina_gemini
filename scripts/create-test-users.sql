-- ============================================================================
-- Create Test Users for RLS Testing
-- Date: 2026-01-14
-- Purpose: Create test users with different roles for RLS security testing
-- ============================================================================

-- IMPORTANT: Replace placeholders with actual values
-- You'll need to:
-- 1. Create auth users in Supabase Dashboard → Authentication
-- 2. Get their user IDs
-- 3. Update the user_id values below
-- 4. Get institution IDs from your database

-- ============================================================================
-- Test User 1: Platform Admin (Super Admin)
-- ============================================================================

-- Replace 'PLATFORM_ADMIN_USER_ID' with actual user ID from auth.users
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'PLATFORM_ADMIN_USER_ID'::uuid,
  NULL, -- Platform admin has no institution
  'platform.admin@test.com',
  'Platform Admin Test User',
  'PLATFORM_ADMIN',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'PLATFORM_ADMIN',
  institution_id = NULL,
  status = 'ACTIVE';

-- ============================================================================
-- Test User 2: Institution Admin (Institution A)
-- ============================================================================

-- Replace 'INST_ADMIN_A_USER_ID' and 'INSTITUTION_A_ID' with actual IDs
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'INST_ADMIN_A_USER_ID'::uuid,
  'INSTITUTION_A_ID'::uuid,
  'admin.a@test.com',
  'Institution A Admin',
  'INSTITUTION_ADMIN',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'INSTITUTION_ADMIN',
  institution_id = 'INSTITUTION_A_ID'::uuid,
  status = 'ACTIVE';

-- ============================================================================
-- Test User 3: Institution Admin (Institution B)
-- ============================================================================

-- Replace 'INST_ADMIN_B_USER_ID' and 'INSTITUTION_B_ID' with actual IDs
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'INST_ADMIN_B_USER_ID'::uuid,
  'INSTITUTION_B_ID'::uuid,
  'admin.b@test.com',
  'Institution B Admin',
  'INSTITUTION_ADMIN',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'INSTITUTION_ADMIN',
  institution_id = 'INSTITUTION_B_ID'::uuid,
  status = 'ACTIVE';

-- ============================================================================
-- Test User 4: Institution Staff (Institution A)
-- ============================================================================

-- Replace 'INST_STAFF_A_USER_ID' and 'INSTITUTION_A_ID' with actual IDs
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'INST_STAFF_A_USER_ID'::uuid,
  'INSTITUTION_A_ID'::uuid,
  'staff.a@test.com',
  'Institution A Staff',
  'INSTITUTION_STAFF',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'INSTITUTION_STAFF',
  institution_id = 'INSTITUTION_A_ID'::uuid,
  status = 'ACTIVE';

-- ============================================================================
-- Test User 5: Institution Treasurer (Institution A)
-- ============================================================================

-- Replace 'INST_TREASURER_A_USER_ID' and 'INSTITUTION_A_ID' with actual IDs
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'INST_TREASURER_A_USER_ID'::uuid,
  'INSTITUTION_A_ID'::uuid,
  'treasurer.a@test.com',
  'Institution A Treasurer',
  'INSTITUTION_TREASURER',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'INSTITUTION_TREASURER',
  institution_id = 'INSTITUTION_A_ID'::uuid,
  status = 'ACTIVE';

-- ============================================================================
-- Test User 6: Institution Auditor (Institution A)
-- ============================================================================

-- Replace 'INST_AUDITOR_A_USER_ID' and 'INSTITUTION_A_ID' with actual IDs
INSERT INTO profiles (
  user_id,
  institution_id,
  email,
  full_name,
  role,
  status,
  is_active
) VALUES (
  'INST_AUDITOR_A_USER_ID'::uuid,
  'INSTITUTION_A_ID'::uuid,
  'auditor.a@test.com',
  'Institution A Auditor',
  'INSTITUTION_AUDITOR',
  'ACTIVE',
  true
) ON CONFLICT (user_id) DO UPDATE SET
  role = 'INSTITUTION_AUDITOR',
  institution_id = 'INSTITUTION_A_ID'::uuid,
  status = 'ACTIVE';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check created test users
SELECT 
  user_id,
  email,
  full_name,
  role,
  institution_id,
  status
FROM profiles
WHERE email LIKE '%@test.com'
ORDER BY role, institution_id;

-- Get institution IDs (for reference)
SELECT id, name, code FROM institutions ORDER BY name;
