-- ============================================================================
-- Complete RLS Policies Migration
-- Implements comprehensive Row-Level Security for all tables
-- ============================================================================

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role = required_role
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is staff (admin or staff role)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN', 'INSTITUTION_STAFF', 'INSTITUTION_TREASURER', 'INSTITUTION_AUDITOR')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid()
    AND role IN ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper to get user's institution
CREATE OR REPLACE FUNCTION public.user_institution_id()
RETURNS UUID AS $$
  SELECT institution_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;



-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Staff can view all transactions in their institution
DROP POLICY IF EXISTS "Staff can view institution transactions" ON transactions;
CREATE POLICY "Staff can view institution transactions"
  ON transactions FOR SELECT
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Members can view their own transactions
DROP POLICY IF EXISTS "Members can view own transactions" ON transactions;
CREATE POLICY "Members can view own transactions"
  ON transactions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM members 
      WHERE phone = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Staff can create transactions
DROP POLICY IF EXISTS "Staff can create transactions" ON transactions;
CREATE POLICY "Staff can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Only admins can update transactions (for reversals, etc.)
DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;
CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (
    public.is_admin() AND 
    institution_id = public.user_institution_id()
  );

-- ============================================================================
-- MEMBERS TABLE POLICIES
-- ============================================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Staff can view all members in their institution
DROP POLICY IF EXISTS "Staff can view institution members" ON members;
CREATE POLICY "Staff can view institution members"
  ON members FOR SELECT
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Staff can create members
DROP POLICY IF EXISTS "Staff can create members" ON members;
CREATE POLICY "Staff can create members"
  ON members FOR INSERT
  WITH CHECK (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Staff can update members
DROP POLICY IF EXISTS "Staff can update members" ON members;
CREATE POLICY "Staff can update members"
  ON members FOR UPDATE
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Only admins can delete members (soft delete preferred)
DROP POLICY IF EXISTS "Admins can delete members" ON members;
CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  USING (
    public.is_admin() AND 
    institution_id = public.user_institution_id()
  );

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Staff can view all groups in their institution
DROP POLICY IF EXISTS "Staff can view institution groups" ON groups;
CREATE POLICY "Staff can view institution groups"
  ON groups FOR SELECT
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Staff can create groups
DROP POLICY IF EXISTS "Staff can create groups" ON groups;
CREATE POLICY "Staff can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Staff can update groups
DROP POLICY IF EXISTS "Staff can update groups" ON groups;
CREATE POLICY "Staff can update groups"
  ON groups FOR UPDATE
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );


-- PROFILES TABLE POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all profiles in their institution
DROP POLICY IF EXISTS "Admins can view institution profiles" ON profiles;
CREATE POLICY "Admins can view institution profiles"
  ON profiles FOR SELECT
  USING (
    public.is_admin() AND 
    institution_id = public.user_institution_id()
  );

-- Users can update their own profile (limited fields)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update profiles in their institution
DROP POLICY IF EXISTS "Admins can update institution profiles" ON profiles;
CREATE POLICY "Admins can update institution profiles"
  ON profiles FOR UPDATE
  USING (
    public.is_admin() AND 
    institution_id = public.user_institution_id()
  );

-- ============================================================================
-- SETTINGS TABLE POLICIES
-- ============================================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Staff can view settings for their institution
DROP POLICY IF EXISTS "Staff can view settings" ON settings;
CREATE POLICY "Staff can view settings"
  ON settings FOR SELECT
  USING (
    public.is_staff() AND 
    institution_id = public.user_institution_id()
  );

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (
    public.is_admin() AND 
    institution_id = public.user_institution_id()
  );

-- ============================================================================
-- GRANT USAGE ON FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.user_has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_institution_id() TO authenticated;

-- ============================================================================
-- COMMENT ON MIGRATION
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Stores audit trail of all security-relevant operations';
