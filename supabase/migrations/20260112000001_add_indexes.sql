-- ============================================================================
-- Performance Indexes Migration
-- Adds missing indexes for frequently queried columns
-- ============================================================================

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date 
  ON transactions(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_institution_date 
  ON transactions(institution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
  ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_type 
  ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_group_id 
  ON transactions(group_id);

-- Members indexes
CREATE INDEX IF NOT EXISTS idx_members_phone 
  ON members(phone);

CREATE INDEX IF NOT EXISTS idx_members_institution_status 
  ON members(institution_id, status);

CREATE INDEX IF NOT EXISTS idx_members_kyc_status 
  ON members(kyc_status);

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_institution_status 
  ON groups(institution_id, status);

CREATE INDEX IF NOT EXISTS idx_groups_name_search 
  ON groups(group_name);

-- Contributions indexes
CREATE INDEX IF NOT EXISTS idx_contributions_member_date 
  ON contributions(member_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_group_date 
  ON contributions(group_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_status 
  ON contributions(status);

-- SMS messages indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_institution_date 
  ON sms_messages(institution_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_parsed 
  ON sms_messages(is_parsed);

CREATE INDEX IF NOT EXISTS idx_sms_messages_sender 
  ON sms_messages(sender);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_institution_role 
  ON profiles(institution_id, role);

CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON profiles(email);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_institution 
  ON settings(institution_id);

-- ============================================================================
-- Add audit trail columns where missing
-- ============================================================================

-- Add soft delete columns if not exist
DO $$ 
BEGIN
  -- members table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'members' AND column_name = 'deleted_at') THEN
    ALTER TABLE members ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- groups table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'groups' AND column_name = 'deleted_at') THEN
    ALTER TABLE groups ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
  END IF;

  -- Add updated_by columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'members' AND column_name = 'updated_by') THEN
    ALTER TABLE members ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'groups' AND column_name = 'updated_by') THEN
    ALTER TABLE groups ADD COLUMN updated_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'transactions' AND column_name = 'created_by') THEN
    ALTER TABLE transactions ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Create index on soft delete columns
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_groups_deleted_at ON groups(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- Add check constraints for data integrity
-- ============================================================================

-- Ensure transaction amounts are positive
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_transaction_amount_positive') THEN
    ALTER TABLE transactions ADD CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure contribution amounts are positive
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_contribution_amount_positive') THEN
    ALTER TABLE contributions ADD CONSTRAINT chk_contribution_amount_positive CHECK (amount > 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- Comment on indexes
-- ============================================================================

COMMENT ON INDEX idx_transactions_user_date IS 'Optimizes transaction history queries by user';
COMMENT ON INDEX idx_members_phone IS 'Optimizes member lookup by phone number';
COMMENT ON INDEX idx_groups_institution_status IS 'Optimizes group listing with status filter';
