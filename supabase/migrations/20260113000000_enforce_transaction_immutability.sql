-- ============================================================================
-- Enhanced Transaction Immutability
-- Date: 2026-01-13
-- Purpose: Add momo_tx_id to protected immutable fields
-- ============================================================================

-- Update the immutability function to also protect momo_tx_id
CREATE OR REPLACE FUNCTION public.enforce_transaction_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- List of immutable columns (transaction facts)
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    RAISE EXCEPTION 'Cannot modify transaction amount (immutable fact)';
  END IF;
  
  IF OLD.occurred_at IS DISTINCT FROM NEW.occurred_at THEN
    RAISE EXCEPTION 'Cannot modify transaction occurred_at (immutable fact)';
  END IF;
  
  IF OLD.payer_phone IS DISTINCT FROM NEW.payer_phone THEN
    RAISE EXCEPTION 'Cannot modify transaction payer_phone (immutable fact)';
  END IF;
  
  IF OLD.payer_name IS DISTINCT FROM NEW.payer_name THEN
    RAISE EXCEPTION 'Cannot modify transaction payer_name (immutable fact)';
  END IF;
  
  IF OLD.momo_ref IS DISTINCT FROM NEW.momo_ref THEN
    RAISE EXCEPTION 'Cannot modify transaction momo_ref (immutable fact)';
  END IF;
  
  -- NEW: Protect momo_tx_id
  IF OLD.momo_tx_id IS DISTINCT FROM NEW.momo_tx_id THEN
    RAISE EXCEPTION 'Cannot modify MoMo transaction ID (immutable fact)';
  END IF;
  
  IF OLD.momo_sms_id IS DISTINCT FROM NEW.momo_sms_id THEN
    RAISE EXCEPTION 'Cannot modify transaction momo_sms_id (immutable fact)';
  END IF;
  
  -- Also check source_sms_id (alias for momo_sms_id in some contexts)
  IF OLD.source_sms_id IS DISTINCT FROM NEW.source_sms_id THEN
    RAISE EXCEPTION 'Cannot modify transaction source_sms_id (immutable fact)';
  END IF;
  
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    RAISE EXCEPTION 'Cannot modify transaction currency (immutable fact)';
  END IF;
  
  IF OLD.institution_id IS DISTINCT FROM NEW.institution_id THEN
    RAISE EXCEPTION 'Cannot modify transaction institution_id (immutable fact)';
  END IF;
  
  IF OLD.parse_confidence IS DISTINCT FROM NEW.parse_confidence THEN
    RAISE EXCEPTION 'Cannot modify transaction parse_confidence (immutable fact)';
  END IF;
  
  -- These columns CAN be modified:
  -- member_id, group_id, allocation_status, allocated_by, allocated_at, allocation_note
  -- status (transaction status like COMPLETED, REVERSED), type, channel, reference
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (recreate to pick up function changes)
DROP TRIGGER IF EXISTS trigger_transaction_immutability ON public.transactions;
DROP TRIGGER IF EXISTS enforce_transaction_immutability ON public.transactions;

CREATE TRIGGER trigger_transaction_immutability
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_transaction_immutability();

COMMENT ON FUNCTION public.enforce_transaction_immutability IS 
  'Enforces immutability of core transaction fields: amount, occurred_at, payer_phone, payer_name, momo_ref, momo_tx_id, momo_sms_id, source_sms_id, currency, institution_id, parse_confidence';

-- ============================================================================
-- End of migration
-- ============================================================================
