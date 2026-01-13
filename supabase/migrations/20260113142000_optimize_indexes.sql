-- Critical transaction queries (most important)
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at 
  ON transactions(institution_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_allocation 
  ON transactions(institution_id, allocation_status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_search 
  ON transactions USING gin(to_tsvector('english', 
    coalesce(payer_name, '') || ' ' || 
    coalesce(momo_ref, '')));

-- Member lookups for allocation
CREATE INDEX IF NOT EXISTS idx_members_phone 
  ON members(institution_id, phone) 
  WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_members_group 
  ON members(group_id) WHERE status = 'active';

-- SMS processing queue
CREATE INDEX IF NOT EXISTS idx_sms_pending 
  ON momo_sms_raw(institution_id, processed_at, received_at DESC) 
  WHERE processed_at IS NULL;

-- Audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_recent 
  ON audit_log(institution_id, created_at DESC);

-- Group operations
CREATE INDEX IF NOT EXISTS idx_groups_institution 
  ON groups(institution_id, status) WHERE status = 'active';

-- Add unique constraint for momo_tx_id (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_momo_tx_id_unique
  ON transactions(institution_id, momo_tx_id) 
  WHERE momo_tx_id IS NOT NULL;

