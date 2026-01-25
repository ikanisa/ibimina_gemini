-- Update contribution limit to 1,000 RWF
-- Replaces the check_transaction_limits function

CREATE OR REPLACE FUNCTION public.check_transaction_limits()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance numeric;
  v_max_contribution numeric := 1000; -- UPDATED: strict 1,000 limit
  v_max_wallet numeric := 500000;
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
       AND status = 'COMPLETED'; -- Fixed status check

     IF (v_current_balance + NEW.amount) > v_max_wallet THEN
       RAISE EXCEPTION 'Wallet balance limit exceeded. Max % RWF allowed.', v_max_wallet;
     END IF;
  END IF;

  RETURN NEW;
END;
$$;
