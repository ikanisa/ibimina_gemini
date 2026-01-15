-- Remove duplicate member_id FK on transactions if the default FK exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transactions_member'
  )
  AND EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transactions_member_id_fkey'
  ) THEN
    ALTER TABLE public.transactions
      DROP CONSTRAINT fk_transactions_member;
  END IF;
END $$;
