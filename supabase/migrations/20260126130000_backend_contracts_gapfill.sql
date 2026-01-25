-- ============================================================================
-- Migration: Backend Contracts Gapfill
-- Purpose: Add Leaderboard View and enforce One-Group Constraint
-- ============================================================================

-- 1. Leaderboard View
-- Aggregates confirmed transactions for the current month for Public Active Groups.
-- Note: 'confirmed' status is key.
CREATE OR REPLACE VIEW public.view_leaderboard_monthly AS
WITH monthly_stats AS (
  SELECT 
    t.group_id,
    SUM(t.amount) as confirmed_total
  FROM public.transactions t
  WHERE t.status = 'confirmed' 
    AND t.created_at >= date_trunc('month', now())
  GROUP BY t.group_id
)
SELECT 
  g.id as group_id,
  g.group_name,
  COALESCE(ms.confirmed_total, 0) as confirmed_total,
  (SELECT count(*) FROM public.members m WHERE m.group_id = g.id AND m.status = 'ACTIVE') as member_count,
  RANK() OVER (ORDER BY COALESCE(ms.confirmed_total, 0) DESC) as rank
FROM public.groups g
LEFT JOIN monthly_stats ms ON g.id = ms.group_id
WHERE g.type = 'PUBLIC' 
  AND g.status = 'ACTIVE';

-- Grant access
GRANT SELECT ON public.view_leaderboard_monthly TO authenticated;

-- 2. Enforce One-Group Rule
-- Ensure a user_id appears only once in active members
-- We likely have this via logic, but DB constraint is safer.
-- If members table has user_id, generic unique index might be too strong if we allow history.
-- Better: Unique where status = ACTIVE.

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_user_id_active_unique 
  ON public.members(user_id) 
  WHERE status = 'ACTIVE';

-- If using group_members junction table:
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_member_id_active_unique
  ON public.group_members(member_id)
  WHERE status IN ('GOOD_STANDING', 'MEMBER', 'ADMIN', 'OWNER');
