-- Remove deprecated NFC and Token features from database
-- This migration drops NFC logs table and token_balance column

-- Drop NFC logs table
DROP TABLE IF EXISTS public.nfc_logs CASCADE;

-- Remove token_balance column from members if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'members' 
    AND column_name = 'token_balance'
  ) THEN
    ALTER TABLE public.members DROP COLUMN token_balance;
  END IF;
END $$;

-- Remove token-related constraints if they exist
DROP INDEX IF EXISTS idx_nfc_logs_institution_id;
DROP INDEX IF EXISTS idx_nfc_logs_member_id;
DROP INDEX IF EXISTS idx_nfc_logs_timestamp;
