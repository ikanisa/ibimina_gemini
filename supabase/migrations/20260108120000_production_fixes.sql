-- Migration: Production Performance Indexes
-- Created: 2026-01-08

-- Transactions: Used for rapid sorting and filtering
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_institution_status ON public.transactions(institution_id, status);

-- Contributions: Used for dashboard stats and monthly grids
CREATE INDEX IF NOT EXISTS idx_contributions_date ON public.contributions(date DESC);

-- SMS Messages: Used for MoMo reconciliation
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON public.sms_messages(timestamp DESC);
