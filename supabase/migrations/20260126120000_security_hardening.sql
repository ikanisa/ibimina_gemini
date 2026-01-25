-- ============================================================================
-- Migration: Security Hardening & Limits
-- Purpose: Enforce RLS scope (Group-level) and financial constraints (4k/500k)
-- ============================================================================

-- ============================================================================
-- STEP 1: RLS Hardening for Transactions
-- ============================================================================

-- Drop existing generic institution-level policy if it exists
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
DROP POLICY IF EXISTS "transactions_select_v2" ON public.transactions;

-- Create new Group-Scoped Policy
-- Users can only see transactions for groups they are actively part of.
-- Admins/Staff can see everything in their institution.
CREATE POLICY "transactions_select_secured" ON public.transactions
FOR SELECT TO authenticated
USING (
  -- 1. Platform Admins see all
  public.is_platform_admin() 
  OR 
  -- 2. Institution Staff/Admins see their institution
  (
    public.current_institution_id() = institution_id
    AND public.can_manage_institution(institution_id)
  )
  OR
  -- 3. Standard Members see only their group's transactions
  (
    EXISTS (
      SELECT 1 
      FROM public.group_members gm
      JOIN public.members m ON gm.member_id = m.id
      WHERE m.user_id = auth.uid()
        AND gm.group_id = transactions.group_id
        AND gm.status IN ('GOOD_STANDING', 'MEMBER', 'ADMIN', 'OWNER') -- Ensure active status
    )
  )
);

-- ============================================================================
-- STEP 2: RLS Hardening for Members
-- ============================================================================

DROP POLICY IF EXISTS "members_select" ON public.members;

-- Users can only see profiles of members in their shared groups
CREATE POLICY "members_select_secured" ON public.members
FOR SELECT TO authenticated
USING (
  -- 1. Platform Admins see all
  public.is_platform_admin() 
  OR 
  -- 2. Institution Staff/Admins see their institution
  (
    public.current_institution_id() = institution_id
    AND public.can_manage_institution(institution_id)
  )
  OR
  -- 3. Standard Members see members in their same group
  (
    EXISTS (
      SELECT 1 
      FROM public.group_members my_gm
      JOIN public.members my_m ON my_gm.member_id = my_m.id
      JOIN public.group_members target_gm ON my_gm.group_id = target_gm.group_id
      WHERE my_m.user_id = auth.uid()
        AND target_gm.member_id = members.id
        AND my_gm.status IN ('GOOD_STANDING', 'MEMBER', 'ADMIN', 'OWNER')
    )
  )
  OR
  -- 4. Users can always see themselves
  (members.user_id = auth.uid())
);

-- ============================================================================
-- STEP 3: Financial Limits (4,000 RWF Contribution Cap) + Rate Limiting
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_transaction_limits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance numeric;
  v_max_contribution numeric := 4000;
  v_max_wallet numeric := 500000;
  v_rl_result jsonb;
BEGIN
  -- 0. Rate Limit (Max 5 transactions per minute per user to prevent spam/abuse)
  -- Uses key: 'tx_insert:user_id'
  IF auth.uid() IS NOT NULL THEN
     v_rl_result := public.check_rate_limit(
        'tx_insert:' || auth.uid(), 
        5,  -- limit
        60, -- window seconds
        extract(epoch from now())::bigint * 1000 -- current timestamp ms
     );
     
     IF NOT (v_rl_result->>'allowed')::boolean THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting again.';
     END IF;
  END IF;

  -- 1. Check Contribution Limit (only for deposits)
  -- Assuming positive amount is deposit.
  IF NEW.amount > v_max_contribution THEN
    RAISE EXCEPTION 'Contribution limit exceeded. Maximum allowed is % RWF.', v_max_contribution;
  END IF;

  -- 2. Check Wallet Cap
  -- Calculate current CONFIRMED balance for this member
  IF NEW.member_id IS NOT NULL THEN
     SELECT COALESCE(SUM(amount), 0) INTO v_current_balance
     FROM public.transactions
     WHERE member_id = NEW.member_id
       AND status = 'confirmed';

     IF (v_current_balance + NEW.amount) > v_max_wallet THEN
       RAISE EXCEPTION 'Wallet balance limit exceeded. Max % RWF allowed.', v_max_wallet;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_transaction_limits ON public.transactions;

CREATE TRIGGER trigger_enforce_transaction_limits
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_transaction_limits();

-- ============================================================================
-- STEP 4: Anti-Replay (Unique Transaction ID)
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_external_id 
  ON public.transactions(transaction_id) 
  WHERE transaction_id IS NOT NULL;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'momo_ref') THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_unique_momo_ref 
      ON public.transactions(momo_ref) 
      WHERE momo_ref IS NOT NULL;
  END IF;
END $$;
