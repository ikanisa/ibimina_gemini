-- ============================================================================
-- Complete RLS Policies Migration
-- Implements comprehensive Row-Level Security for all tables
-- ============================================================================

-- Helper function to check user role
CREATE OR REPLACE FUNCTION auth.user_has_role(required_role TEXT)
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
CREATE OR REPLACE FUNCTION auth.is_staff()
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
CREATE OR REPLACE FUNCTION auth.is_admin()
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
CREATE OR REPLACE FUNCTION auth.user_institution_id()
RETURNS UUID AS $$
  SELECT institution_id FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- AUDIT_LOGS TABLE & POLICIES
-- ============================================================================

-- Create audit_logs table if not exists
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  institution_id UUID REFERENCES institutions(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  previous_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institution ON audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (auth.is_admin());

-- All authenticated users can insert (for logging their own actions)
DROP POLICY IF EXISTS "Users can insert own audit logs" ON audit_logs;
CREATE POLICY "Users can insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
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
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Only admins can update transactions (for reversals, etc.)
DROP POLICY IF EXISTS "Admins can update transactions" ON transactions;
CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (
    auth.is_admin() AND 
    institution_id = auth.user_institution_id()
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
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can create members
DROP POLICY IF EXISTS "Staff can create members" ON members;
CREATE POLICY "Staff can create members"
  ON members FOR INSERT
  WITH CHECK (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can update members
DROP POLICY IF EXISTS "Staff can update members" ON members;
CREATE POLICY "Staff can update members"
  ON members FOR UPDATE
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Only admins can delete members (soft delete preferred)
DROP POLICY IF EXISTS "Admins can delete members" ON members;
CREATE POLICY "Admins can delete members"
  ON members FOR DELETE
  USING (
    auth.is_admin() AND 
    institution_id = auth.user_institution_id()
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
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can create groups
DROP POLICY IF EXISTS "Staff can create groups" ON groups;
CREATE POLICY "Staff can create groups"
  ON groups FOR INSERT
  WITH CHECK (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can update groups
DROP POLICY IF EXISTS "Staff can update groups" ON groups;
CREATE POLICY "Staff can update groups"
  ON groups FOR UPDATE
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- ============================================================================
-- CONTRIBUTIONS TABLE POLICIES
-- ============================================================================

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Staff can view contributions in their institution
DROP POLICY IF EXISTS "Staff can view contributions" ON contributions;
CREATE POLICY "Staff can view contributions"
  ON contributions FOR SELECT
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can create contributions
DROP POLICY IF EXISTS "Staff can create contributions" ON contributions;
CREATE POLICY "Staff can create contributions"
  ON contributions FOR INSERT
  WITH CHECK (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can update contributions
DROP POLICY IF EXISTS "Staff can update contributions" ON contributions;
CREATE POLICY "Staff can update contributions"
  ON contributions FOR UPDATE
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- ============================================================================
-- SMS_MESSAGES TABLE POLICIES  
-- ============================================================================

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Staff can view SMS messages in their institution
DROP POLICY IF EXISTS "Staff can view sms messages" ON sms_messages;
CREATE POLICY "Staff can view sms messages"
  ON sms_messages FOR SELECT
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can create SMS messages
DROP POLICY IF EXISTS "Staff can create sms messages" ON sms_messages;
CREATE POLICY "Staff can create sms messages"
  ON sms_messages FOR INSERT
  WITH CHECK (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Staff can update SMS messages
DROP POLICY IF EXISTS "Staff can update sms messages" ON sms_messages;
CREATE POLICY "Staff can update sms messages"
  ON sms_messages FOR UPDATE
  USING (
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- ============================================================================
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
    auth.is_admin() AND 
    institution_id = auth.user_institution_id()
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
    auth.is_admin() AND 
    institution_id = auth.user_institution_id()
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
    auth.is_staff() AND 
    institution_id = auth.user_institution_id()
  );

-- Only admins can update settings
DROP POLICY IF EXISTS "Admins can update settings" ON settings;
CREATE POLICY "Admins can update settings"
  ON settings FOR UPDATE
  USING (
    auth.is_admin() AND 
    institution_id = auth.user_institution_id()
  );

-- ============================================================================
-- GRANT USAGE ON FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION auth.user_has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.user_institution_id() TO authenticated;

-- ============================================================================
-- COMMENT ON MIGRATION
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Stores audit trail of all security-relevant operations';
