-- ============================================================================
-- RLS Verification Queries
-- Purpose: Verify Staff vs Admin access patterns
-- Run with: npx supabase db execute --file supabase/migrations/verify_rls.sql
-- ============================================================================

-- ============================================================================
-- QUERY 1: List all tables with RLS status and policy counts
-- ============================================================================

SELECT 
  c.relname as table_name,
  CASE WHEN c.relrowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = c.relname) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
ORDER BY c.relname;

-- ============================================================================
-- QUERY 2: List all RLS policies with details
-- ============================================================================

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE 
    WHEN LENGTH(qual) > 100 THEN SUBSTRING(qual, 1, 100) || '...'
    ELSE qual
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- QUERY 3: Role-Capability Matrix Verification
-- 
-- This query shows what each helper function returns
-- Run as different users to verify behavior
-- ============================================================================

SELECT 
  auth.uid() as current_user_id,
  public.is_staff() as is_staff,
  public.is_admin() as is_admin,
  public.user_institution_id() as institution_id,
  (SELECT role FROM profiles WHERE user_id = auth.uid()) as user_role;

-- ============================================================================
-- QUERY 4: Cross-institution isolation test
-- 
-- Should return 0 rows if RLS is working correctly
-- (Assuming user is in a specific institution)
-- ============================================================================

-- Count members NOT in user's institution (should be 0 or error)
SELECT 
  'members' as table_name,
  COUNT(*) as cross_institution_count
FROM members
WHERE institution_id != public.user_institution_id();

-- ============================================================================
-- QUERY 5: Tables missing RLS
-- ============================================================================

SELECT c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT IN ('schema_migrations', 'supabase_migrations')
ORDER BY c.relname;

-- ============================================================================
-- QUERY 6: Tables with RLS but no policies (dangerous!)
-- ============================================================================

SELECT c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = c.relname
  )
ORDER BY c.relname;

-- ============================================================================
-- EXPECTED RESULTS SUMMARY
-- ============================================================================
-- 
-- Query 1: All sensitive tables should show "✅ Enabled"
-- Query 2: Should show policies for all tables
-- Query 3: Should return correct role info for current user
-- Query 4: Should return 0 (no cross-institution data leakage)
-- Query 5: Should be empty or only show non-sensitive system tables
-- Query 6: MUST be empty (RLS enabled but no policies = locked table)
-- ============================================================================
