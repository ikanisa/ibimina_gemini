-- Migration: Add payment_ledger table
-- This table is referenced throughout the frontend codebase but was missing from the schema
-- Created: 2025-01-02

CREATE TABLE IF NOT EXISTS public.payment_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  txn_type text NOT NULL,
  amount numeric(16, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'RWF',
  counterparty text,
  reference text,
  txn_id text,
  reconciled boolean NOT NULL DEFAULT false,
  status text DEFAULT 'PENDING',
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_ledger_institution_id 
  ON public.payment_ledger(institution_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_member_id 
  ON public.payment_ledger(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_group_id 
  ON public.payment_ledger(group_id);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_reconciled 
  ON public.payment_ledger(reconciled);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_timestamp 
  ON public.payment_ledger(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_payment_ledger_created_at 
  ON public.payment_ledger(created_at DESC);

-- RLS Policy
ALTER TABLE public.payment_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_ledger_access" ON public.payment_ledger;
CREATE POLICY "payment_ledger_access"
ON public.payment_ledger
FOR ALL
USING (public.is_platform_admin() OR institution_id = public.current_institution_id())
WITH CHECK (public.is_platform_admin() OR institution_id = public.current_institution_id());

-- Add comment
COMMENT ON TABLE public.payment_ledger IS 'Payment ledger for tracking MoMo transactions and reconciling with SMS messages';

