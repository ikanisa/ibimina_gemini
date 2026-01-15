-- Restore loans module after consolidation removal

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
    CREATE TYPE loan_status AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'OVERDUE', 'CLOSED', 'REJECTED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  amount numeric(16, 2) NOT NULL,
  outstanding_balance numeric(16, 2) NOT NULL DEFAULT 0,
  status loan_status NOT NULL DEFAULT 'PENDING_APPROVAL',
  start_date date NOT NULL,
  next_payment_date date,
  interest_rate numeric(5, 2) NOT NULL DEFAULT 0,
  term_months integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loans_institution_id ON public.loans (institution_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON public.loans (member_id);
CREATE INDEX IF NOT EXISTS idx_loans_group_id ON public.loans (group_id);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loans_access" ON public.loans;
CREATE POLICY "loans_access"
ON public.loans
FOR ALL
USING (public.is_platform_admin() OR institution_id = public.current_institution_id())
WITH CHECK (public.is_platform_admin() OR institution_id = public.current_institution_id());
