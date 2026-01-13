-- ============================================================================
-- Enforce Transaction Immutability & Add Missing Columns
-- Date: 2026-01-17
-- Purpose: Strictly purge mutable fields and enforce immutability on core facts
-- ============================================================================

-- 1. Ensure required columns exist
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS momo_tx_id text,
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- 2. Create strict immutability trigger function
CREATE OR REPLACE FUNCTION public.prevent_transaction_core_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Block updates to core immutable facts
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    RAISE EXCEPTION 'Cannot modify transaction amount (immutable fact)';
  END IF;

  IF OLD.occurred_at IS DISTINCT FROM NEW.occurred_at THEN
    RAISE EXCEPTION 'Cannot modify transaction occurred_at (immutable fact)';
  END IF;

  IF OLD.momo_tx_id IS DISTINCT FROM NEW.momo_tx_id THEN
    RAISE EXCEPTION 'Cannot modify transaction momo_tx_id (immutable fact)';
  END IF;

  IF OLD.momo_ref IS DISTINCT FROM NEW.momo_ref THEN
    RAISE EXCEPTION 'Cannot modify transaction momo_ref (immutable fact)';
  END IF;

  IF OLD.payer_phone IS DISTINCT FROM NEW.payer_phone THEN
    RAISE EXCEPTION 'Cannot modify transaction payer_phone (immutable fact)';
  END IF;

  IF OLD.payer_name IS DISTINCT FROM NEW.payer_name THEN
    RAISE EXCEPTION 'Cannot modify transaction payer_name (immutable fact)';
  END IF;

  IF OLD.institution_id IS DISTINCT FROM NEW.institution_id THEN
    RAISE EXCEPTION 'Cannot modify transaction institution_id (immutable fact)';
  END IF;

  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    RAISE EXCEPTION 'Cannot modify transaction currency (immutable fact)';
  END IF;

  IF OLD.momo_sms_id IS DISTINCT FROM NEW.momo_sms_id THEN
    RAISE EXCEPTION 'Cannot modify transaction momo_sms_id (immutable fact)';
  END IF;

  -- Allow updates ONLY to: 
  -- member_id, group_id, allocation_status, allocated_at, allocated_by, 
  -- notes (allocation_note), is_flagged, is_duplicate
  -- Note: We don't need to explicitly "allow" them, the absence of a check allows them.
  -- But we CAN enforce that nothing else changes if we want to be super strict.
  -- For now, the blocklist above covers the "Core Facts".
  
  -- Audit Log Injection (if handled here, else relies on separate trigger)
  -- The requirement says "Add audit_log entry on every allocation change"
  -- We'll handle that in a separate dedicated Audit Trigger to keep concerns separated,
  -- or we can do it here. The prompt implies "Add audit_log entry" is a requirement of the TASK.
  -- We will rely on the generic audit trigger in step 5 for this, or the API layer.
  -- But let's check if we should add it here. The prompt groups it under "Transaction Immutability".
  -- "Add audit_log entry on every allocation change"
  -- Ideally, an AFTER UPDATE trigger handles logging. This is a BEFORE UPDATE trigger.
  
  RETURN NEW;
END;
$$;

-- 3. Apply Trigger
DROP TRIGGER IF EXISTS trigger_prevent_transaction_core_updates ON public.transactions;
-- Drop old triggers if they exist to avoid conflict/double-execution
DROP TRIGGER IF EXISTS trigger_transaction_immutability ON public.transactions;
DROP TRIGGER IF EXISTS enforce_transaction_immutability ON public.transactions;

CREATE TRIGGER trigger_prevent_transaction_core_updates
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_transaction_core_updates();

-- 4. Create Audit Log Helper (Preliminary for Step 5, but needed for immediate impact if requested)
-- For now, we defer the comprehensive audit trigger to Step 5 as per plan.

COMMENT ON FUNCTION public.prevent_transaction_core_updates IS 
  'Enforces strict immutability of transaction core facts (amount, time, source, etc).';
