-- ============================================================================
-- Database Query Optimizations
-- Efficient queries for pagination, N+1 prevention, and foreign keys
-- ============================================================================

-- ============================================================================
-- 1. FOREIGN KEY CONSTRAINTS (missing ones)
-- ============================================================================

-- Ensure transaction references valid member
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS fk_transactions_member
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT;

-- Ensure transaction assigned to valid staff
ALTER TABLE transactions
ADD CONSTRAINT IF NOT EXISTS fk_transactions_created_by
FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE SET NULL;

-- Ensure group belongs to institution
ALTER TABLE groups
ADD CONSTRAINT IF NOT EXISTS fk_groups_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

-- Ensure member belongs to institution
ALTER TABLE members
ADD CONSTRAINT IF NOT EXISTS fk_members_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

-- Ensure profile belongs to institution
ALTER TABLE profiles
ADD CONSTRAINT IF NOT EXISTS fk_profiles_institution
FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE;

-- Ensure group membership references valid member and group
ALTER TABLE group_members
ADD CONSTRAINT IF NOT EXISTS fk_group_members_member
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE group_members
ADD CONSTRAINT IF NOT EXISTS fk_group_members_group
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Ensure contribution records reference valid group and member
ALTER TABLE contributions
ADD CONSTRAINT IF NOT EXISTS fk_contributions_group
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

ALTER TABLE contributions
ADD CONSTRAINT IF NOT EXISTS fk_contributions_member
FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Audit logs reference valid user
ALTER TABLE audit_logs
ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_user
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


-- ============================================================================
-- 2. EFFICIENT PAGINATION QUERIES
-- Using cursor-based pagination for large datasets
-- ============================================================================

-- Function for cursor-based transaction pagination
CREATE OR REPLACE FUNCTION get_transactions_page(
  p_institution_id UUID,
  p_limit INT DEFAULT 50,
  p_cursor TIMESTAMPTZ DEFAULT NULL,
  p_cursor_id UUID DEFAULT NULL,
  p_member_id UUID DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  amount DECIMAL,
  type TEXT,
  status TEXT,
  description TEXT,
  member_id UUID,
  member_name TEXT,
  created_at TIMESTAMPTZ,
  has_more BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actual_limit INT := p_limit + 1;
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.amount,
    t.type,
    t.status,
    t.description,
    t.member_id,
    m.full_name AS member_name,
    t.created_at,
    FALSE AS has_more
  FROM transactions t
  LEFT JOIN members m ON t.member_id = m.id
  WHERE t.institution_id = p_institution_id
    AND (p_cursor IS NULL OR (t.created_at, t.id) < (p_cursor, p_cursor_id))
    AND (p_member_id IS NULL OR t.member_id = p_member_id)
    AND (p_type IS NULL OR t.type = p_type)
    AND (p_status IS NULL OR t.status = p_status)
  ORDER BY t.created_at DESC, t.id DESC
  LIMIT v_actual_limit;
END;
$$;


-- Function for efficient member list with group counts
CREATE OR REPLACE FUNCTION get_members_with_stats(
  p_institution_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_search TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  balance DECIMAL,
  group_count BIGINT,
  last_transaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH member_stats AS (
    SELECT 
      m.id AS member_id,
      COUNT(DISTINCT gm.group_id) AS group_count,
      MAX(t.created_at) AS last_transaction_at
    FROM members m
    LEFT JOIN group_members gm ON m.id = gm.member_id
    LEFT JOIN transactions t ON m.id = t.member_id
    WHERE m.institution_id = p_institution_id
    GROUP BY m.id
  ),
  filtered_members AS (
    SELECT m.*
    FROM members m
    WHERE m.institution_id = p_institution_id
      AND (p_search IS NULL OR 
           m.full_name ILIKE '%' || p_search || '%' OR
           m.email ILIKE '%' || p_search || '%' OR
           m.phone LIKE '%' || p_search || '%')
      AND (p_status IS NULL OR m.status = p_status)
  )
  SELECT 
    fm.id,
    fm.full_name,
    fm.email,
    fm.phone,
    fm.status,
    COALESCE(fm.balance, 0) AS balance,
    COALESCE(ms.group_count, 0) AS group_count,
    ms.last_transaction_at,
    fm.created_at,
    COUNT(*) OVER() AS total_count
  FROM filtered_members fm
  LEFT JOIN member_stats ms ON fm.id = ms.member_id
  ORDER BY fm.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


-- ============================================================================
-- 3. N+1 PREVENTION VIEWS
-- Pre-joined views for common queries
-- ============================================================================

-- Transaction with member and staff info
CREATE OR REPLACE VIEW v_transactions_full AS
SELECT 
  t.id,
  t.amount,
  t.type,
  t.status,
  t.description,
  t.reference,
  t.created_at,
  t.updated_at,
  t.member_id,
  m.full_name AS member_name,
  m.phone AS member_phone,
  t.created_by,
  p.full_name AS created_by_name,
  t.institution_id,
  i.name AS institution_name
FROM transactions t
LEFT JOIN members m ON t.member_id = m.id
LEFT JOIN profiles p ON t.created_by = p.user_id
LEFT JOIN institutions i ON t.institution_id = i.id;

-- Group with stats
CREATE OR REPLACE VIEW v_groups_with_stats AS
SELECT 
  g.id,
  g.name,
  g.type,
  g.contribution_amount,
  g.frequency,
  g.status,
  g.created_at,
  g.institution_id,
  COUNT(DISTINCT gm.member_id) AS member_count,
  COALESCE(SUM(c.amount), 0) AS total_contributions,
  MAX(c.created_at) AS last_contribution_at
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN contributions c ON g.id = c.group_id
GROUP BY g.id;


-- ============================================================================
-- 4. MATERIALIZED VIEW FOR DASHBOARD STATS
-- Refresh periodically rather than computing on every request
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_institution_stats AS
SELECT 
  i.id AS institution_id,
  COUNT(DISTINCT m.id) AS total_members,
  COUNT(DISTINCT CASE WHEN m.status = 'active' THEN m.id END) AS active_members,
  COUNT(DISTINCT g.id) AS total_groups,
  COALESCE(SUM(m.balance), 0) AS total_savings,
  COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.created_at > NOW() - INTERVAL '1 day' 
                    THEN t.amount ELSE 0 END), 0) AS daily_deposits,
  COUNT(DISTINCT CASE WHEN t.created_at > NOW() - INTERVAL '1 day' 
                      THEN t.id END) AS daily_transactions
FROM institutions i
LEFT JOIN members m ON i.id = m.institution_id
LEFT JOIN groups g ON i.id = g.institution_id
LEFT JOIN transactions t ON i.id = t.institution_id
GROUP BY i.id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_institution_stats_id 
ON mv_institution_stats(institution_id);

-- Refresh function (call periodically)
CREATE OR REPLACE FUNCTION refresh_institution_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_institution_stats;
END;
$$;


-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_transactions_page TO authenticated;
GRANT EXECUTE ON FUNCTION get_members_with_stats TO authenticated;
GRANT SELECT ON v_transactions_full TO authenticated;
GRANT SELECT ON v_groups_with_stats TO authenticated;
GRANT SELECT ON mv_institution_stats TO authenticated;
