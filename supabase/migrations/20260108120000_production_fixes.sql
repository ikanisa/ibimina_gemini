-- Migration: Production Performance Indexes (Part 1 - Enums & Safe Indexes)
-- Created: 2026-01-08

-- Transactions: Used for rapid sorting and filtering
-- Note: 'idx_transactions_created_at' might already exist, IF NOT EXISTS handles it.
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_institution_status ON public.transactions(institution_id, status);

-- Ensure enum has required values (Fix for production drift)
ALTER TYPE contribution_status ADD VALUE IF NOT EXISTS 'RECORDED';
ALTER TYPE contribution_status ADD VALUE IF NOT EXISTS 'RECONCILED';
ALTER TYPE contribution_status ADD VALUE IF NOT EXISTS 'FLAGGED';

-- Payment status enum safeguard
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'UNRECONCILED';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'RECONCILED';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'FLAGGED';
