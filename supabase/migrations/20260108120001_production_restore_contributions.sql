-- Migration: Production Fixes (Part 2 - Restore Missing Tables)
-- Created: 2026-01-08

-- 1. Restore Contributions
CREATE TABLE IF NOT EXISTS public.contributions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  member_id uuid references public.members(id) on delete set null,
  date date not null,
  amount numeric(14, 2) not null,
  method text not null,
  reference text,
  status contribution_status not null default 'RECORDED',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  meeting_id uuid references public.meetings(id) on delete set null,
  channel text
);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON public.contributions(date DESC);

-- 2. Restore SMS Messages
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sender text not null,
  timestamp timestamptz not null,
  body text not null,
  is_parsed boolean not null default false,
  parsed_amount numeric(16, 2),
  parsed_currency text,
  parsed_transaction_id text,
  parsed_counterparty text,
  linked_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp ON public.sms_messages(timestamp DESC);

-- 3. Restore Incoming Payments
CREATE TABLE IF NOT EXISTS public.incoming_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  received_date date not null,
  amount numeric(14, 2) not null,
  payer_ref text,
  reference text,
  raw_text text,
  status payment_status not null default 'UNRECONCILED',
  created_at timestamptz not null default now()
);
-- Add index for dashboard logic
CREATE INDEX IF NOT EXISTS idx_incoming_payments_status ON public.incoming_payments(status);
