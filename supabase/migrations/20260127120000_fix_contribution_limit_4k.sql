-- Fix contribution limit to 4,000 RWF as per product constraints
-- Previous migration set to 1,000 which was incorrect

CREATE OR REPLACE FUNCTION public.check_transaction_limits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance numeric;
  v_max_contribution numeric := 4000; -- CORRECT: 4,000 RWF per product rules
  v_max_wallet numeric := 500000;     -- 500,000 RWF wallet cap
  v_rl_result jsonb;
BEGIN
  -- 0. Rate Limit (Max 5 transactions per minute per user to prevent spam/abuse)
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
       AND status = 'COMPLETED';

     IF (v_current_balance + NEW.amount) > v_max_wallet THEN
       RAISE EXCEPTION 'Wallet balance limit exceeded. Max % RWF allowed.', v_max_wallet;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Add CHECK constraint on transactions table for belt-and-suspenders safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_amount_max_check'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_amount_max_check 
    CHECK (amount <= 4000 AND amount > 0);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation THEN 
    RAISE NOTICE 'Cannot add constraint: existing data violates it. Trigger will still enforce.';
END;
$$;

COMMENT ON FUNCTION public.check_transaction_limits() IS 
'Enforces Ibimina financial safety rules:
 - Single contribution max: 4,000 RWF
 - Wallet balance cap: 500,000 RWF
 - Rate limit: 5 tx per minute per user';
