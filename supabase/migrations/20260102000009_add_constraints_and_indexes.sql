-- Migration: Add data validation constraints and performance indexes
-- Created: 2025-01-02

-- Add frequency constraint to groups table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_frequency' 
    AND conrelid = 'public.groups'::regclass
  ) THEN
    ALTER TABLE public.groups 
      ADD CONSTRAINT check_frequency 
      CHECK (frequency IN ('Weekly', 'Monthly'));
  END IF;
END $$;

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_date 
  ON public.contributions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp 
  ON public.sms_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_institution_status 
  ON public.transactions(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_contributions_institution_date 
  ON public.contributions(institution_id, date DESC);

