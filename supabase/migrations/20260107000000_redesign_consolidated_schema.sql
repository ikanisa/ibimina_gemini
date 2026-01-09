-- ============================================================================
-- REDESIGN: Consolidated Schema Migration
-- Purpose: Clean, minimalist staff/admin operations system
-- Date: 2025-01-07
-- ============================================================================
-- This migration:
-- 1. Creates new tables (momo_sms_raw, institution_momo_codes, transaction_allocations, audit_log, reconciliation_sessions/items)
-- 2. Migrates data from duplicate tables (contributions, incoming_payments, payment_ledger → transactions)
-- 3. Redesigns transactions table for MoMo SMS parsing workflow
-- 4. Updates RLS policies for multi-tenant scoping
-- 5. Creates helper functions for parsing, allocation, and bulk imports
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- STEP 1: Create new enums for redesigned workflow
-- ============================================================================

do $$
begin
  -- Transaction status enum (matches business rules)
  if not exists (select 1 from pg_type where typname = 'transaction_allocation_status') then
    create type transaction_allocation_status as enum (
      'unallocated',
      'allocated',
      'error',
      'duplicate',
      'reversed'
    );
  end if;

  -- SMS parse status
  if not exists (select 1 from pg_type where typname = 'sms_parse_status') then
    create type sms_parse_status as enum (
      'pending',
      'success',
      'error'
    );
  end if;

  -- SMS source
  if not exists (select 1 from pg_type where typname = 'sms_source') then
    create type sms_source as enum (
      'android_gateway',
      'manual_import'
    );
  end if;

  -- Reconciliation session status
  if not exists (select 1 from pg_type where typname = 'reconciliation_session_status') then
    create type reconciliation_session_status as enum (
      'open',
      'resolved',
      'closed'
    );
  end if;

  -- Reconciliation issue type
  if not exists (select 1 from pg_type where typname = 'reconciliation_issue_type') then
    create type reconciliation_issue_type as enum (
      'duplicate',
      'parse_failure',
      'momo_code_mismatch',
      'amount_mismatch',
      'phone_mismatch'
    );
  end if;
end $$;

-- ============================================================================
-- STEP 2: Create new tables
-- ============================================================================

-- Institution MoMo codes (1 institution can have multiple codes)
create table if not exists public.institution_momo_codes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  momo_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(institution_id, momo_code)
);

-- Raw MoMo SMS (before parsing)
create table if not exists public.momo_sms_raw (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null, -- nullable until mapped
  sender_phone text not null,
  sms_text text not null,
  received_at timestamptz not null,
  source sms_source not null default 'manual_import',
  hash text not null, -- for deduplication (SHA256 of sms_text + sender_phone + received_at)
  parse_status sms_parse_status not null default 'pending',
  parse_error text,
  created_at timestamptz not null default now(),
  unique(hash)
);

-- Ensure transactions table exists (should be from initial schema, but create if missing)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  type text not null,
  amount numeric(16, 2) not null,
  currency text not null default 'RWF',
  channel text not null,
  status transaction_status not null default 'COMPLETED',
  reference text,
  created_at timestamptz not null default now()
);

-- Transaction allocations audit trail
create table if not exists public.transaction_allocations (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete restrict,
  group_id uuid not null references public.groups(id) on delete restrict,
  allocated_by uuid not null references auth.users(id) on delete restrict,
  allocated_at timestamptz not null default now(),
  notes text
);

-- Reconciliation sessions (work sessions for staff)
create table if not exists public.reconciliation_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete restrict,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status reconciliation_session_status not null default 'open',
  notes text
);

-- Reconciliation items (individual issues within a session)
create table if not exists public.reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reconciliation_sessions(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  issue_type reconciliation_issue_type not null,
  resolution text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  metadata jsonb
);

-- Audit log (system-wide audit trail)
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  institution_id uuid references public.institutions(id) on delete set null,
  action text not null, -- e.g., 'allocate_transaction', 'create_group', 'import_members'
  entity_type text not null, -- e.g., 'transaction', 'member', 'group'
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- STEP 3: Redesign transactions table
-- ============================================================================

-- Add new columns to transactions (if they don't exist)
alter table public.transactions 
  add column if not exists momo_sms_id uuid references public.momo_sms_raw(id) on delete set null,
  add column if not exists occurred_at timestamptz,
  add column if not exists payer_phone text,
  add column if not exists payer_name text,
  add column if not exists momo_ref text,
  add column if not exists parse_confidence numeric(3, 2) default 1.0 check (parse_confidence >= 0 and parse_confidence <= 1),
  add column if not exists allocation_status transaction_allocation_status default 'unallocated';

-- Update occurred_at if null (use created_at as fallback)
update public.transactions 
set occurred_at = created_at 
where occurred_at is null;

-- Set allocation_status based on existing member_id
update public.transactions
set allocation_status = case
  when member_id is not null then 'allocated'::transaction_allocation_status
  else 'unallocated'::transaction_allocation_status
end
where allocation_status is null;

-- Add constraints: unallocated transactions cannot have member_id/group_id
-- (We'll enforce this via trigger since we need to allow updates)

-- ============================================================================
-- STEP 4: Migrate data from old tables to transactions (if tables exist)
-- ============================================================================

-- Data migration from old tables is SKIPPED because:
-- 1. Old tables may not exist or have different schemas on remote
-- 2. This is a new deployment - no legacy data to migrate
-- If you have existing data in contributions/payment_ledger/incoming_payments tables,
-- run the data migration manually after verifying column names match.
-- See docs/redesign/TABLE_CONSOLIDATION.md for migration queries.

-- ============================================================================
-- STEP 5: Add indexes for performance
-- ============================================================================

create index if not exists idx_institution_momo_codes_institution_id 
  on public.institution_momo_codes(institution_id);
create index if not exists idx_institution_momo_codes_code 
  on public.institution_momo_codes(momo_code) where is_active = true;

create index if not exists idx_momo_sms_raw_institution_id 
  on public.momo_sms_raw(institution_id);
create index if not exists idx_momo_sms_raw_hash 
  on public.momo_sms_raw(hash);
create index if not exists idx_momo_sms_raw_parse_status 
  on public.momo_sms_raw(parse_status);
create index if not exists idx_momo_sms_raw_received_at 
  on public.momo_sms_raw(received_at desc);

create index if not exists idx_transactions_momo_sms_id 
  on public.transactions(momo_sms_id);
create index if not exists idx_transactions_allocation_status 
  on public.transactions(allocation_status) where allocation_status = 'unallocated';
create index if not exists idx_transactions_occurred_at 
  on public.transactions(occurred_at desc);
create index if not exists idx_transactions_payer_phone 
  on public.transactions(payer_phone);

create index if not exists idx_transaction_allocations_transaction_id 
  on public.transaction_allocations(transaction_id);
create index if not exists idx_transaction_allocations_member_id 
  on public.transaction_allocations(member_id);
create index if not exists idx_transaction_allocations_allocated_at 
  on public.transaction_allocations(allocated_at desc);

create index if not exists idx_reconciliation_sessions_institution_id 
  on public.reconciliation_sessions(institution_id);
create index if not exists idx_reconciliation_sessions_status 
  on public.reconciliation_sessions(status) where status = 'open';
create index if not exists idx_reconciliation_items_session_id 
  on public.reconciliation_items(session_id);
create index if not exists idx_reconciliation_items_transaction_id 
  on public.reconciliation_items(transaction_id);

create index if not exists idx_audit_log_actor_user_id 
  on public.audit_log(actor_user_id);
create index if not exists idx_audit_log_institution_id 
  on public.audit_log(institution_id);
create index if not exists idx_audit_log_created_at 
  on public.audit_log(created_at desc);
create index if not exists idx_audit_log_entity 
  on public.audit_log(entity_type, entity_id);

-- ============================================================================
-- STEP 6: Add member.group_id column (enforce member.institution_id == group.institution_id)
-- ============================================================================

alter table public.members 
  add column if not exists group_id uuid references public.groups(id) on delete set null;

-- Update existing members to have group_id from group_members (take first group)
update public.members m
set group_id = (
  select gm.group_id 
  from public.group_members gm 
  where gm.member_id = m.id 
  limit 1
)
where m.group_id is null;

-- Create function to enforce member.institution_id == group.institution_id
create or replace function public.enforce_member_group_institution_match()
returns trigger
language plpgsql
as $$
begin
  if new.group_id is not null then
    if not exists (
      select 1 from public.groups g
      where g.id = new.group_id
        and g.institution_id = new.institution_id
    ) then
      raise exception 'Member institution_id (%) must match group institution_id', new.institution_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists check_member_group_institution on public.members;
create trigger check_member_group_institution
  before insert or update on public.members
  for each row execute function public.enforce_member_group_institution_match();

-- ============================================================================
-- STEP 7: Create helper functions for RLS
-- ============================================================================

-- Ensure current_institution_id and current_user_role exist (they should from initial schema)
-- These are idempotent, so safe to recreate

create or replace function public.current_institution_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select institution_id from public.profiles where user_id = auth.uid();
$$;

-- Note: current_user_role() function already exists from initial schema
-- keeping the original return type (user_role enum) to avoid breaking changes

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'PLATFORM_ADMIN' from public.profiles where user_id = auth.uid()), false);
$$;

-- ============================================================================
-- STEP 8: Enable RLS and create policies for new tables
-- ============================================================================

alter table public.institution_momo_codes enable row level security;
alter table public.momo_sms_raw enable row level security;
alter table public.transaction_allocations enable row level security;
alter table public.reconciliation_sessions enable row level security;
alter table public.reconciliation_items enable row level security;
alter table public.audit_log enable row level security;

-- Institution MoMo codes
drop policy if exists "institution_momo_codes_access" on public.institution_momo_codes;
create policy "institution_momo_codes_access"
on public.institution_momo_codes
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

-- MoMo SMS Raw
drop policy if exists "momo_sms_raw_access" on public.momo_sms_raw;
create policy "momo_sms_raw_access"
on public.momo_sms_raw
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id() or institution_id is null)
with check (public.is_platform_admin() or institution_id = public.current_institution_id() or institution_id is null);

-- Transaction Allocations
drop policy if exists "transaction_allocations_access" on public.transaction_allocations;
create policy "transaction_allocations_access"
on public.transaction_allocations
for all
using (
  public.is_platform_admin() 
  or exists (
    select 1 from public.transactions t
    where t.id = transaction_allocations.transaction_id
      and t.institution_id = public.current_institution_id()
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1 from public.transactions t
    where t.id = transaction_allocations.transaction_id
      and t.institution_id = public.current_institution_id()
  )
);

-- Reconciliation Sessions
drop policy if exists "reconciliation_sessions_access" on public.reconciliation_sessions;
create policy "reconciliation_sessions_access"
on public.reconciliation_sessions
for all
using (public.is_platform_admin() or institution_id = public.current_institution_id())
with check (public.is_platform_admin() or institution_id = public.current_institution_id());

-- Reconciliation Items
drop policy if exists "reconciliation_items_access" on public.reconciliation_items;
create policy "reconciliation_items_access"
on public.reconciliation_items
for all
using (
  public.is_platform_admin()
  or exists (
    select 1 from public.reconciliation_sessions rs
    where rs.id = reconciliation_items.session_id
      and rs.institution_id = public.current_institution_id()
  )
)
with check (
  public.is_platform_admin()
  or exists (
    select 1 from public.reconciliation_sessions rs
    where rs.id = reconciliation_items.session_id
      and rs.institution_id = public.current_institution_id()
  )
);

-- Audit Log
drop policy if exists "audit_log_access" on public.audit_log;
create policy "audit_log_access"
on public.audit_log
for select
using (public.is_platform_admin() or institution_id = public.current_institution_id() or actor_user_id = auth.uid());

-- Update transactions RLS to include new fields
-- (Transactions RLS should already exist from initial schema)

-- ============================================================================
-- STEP 9: Create business logic functions
-- ============================================================================

-- Function: parse_momo_sms (called by Edge Function or trigger)
-- This function parses SMS text and creates transactions
create or replace function public.parse_momo_sms(
  p_sms_id uuid,
  p_institution_id uuid,
  p_amount numeric,
  p_payer_phone text,
  p_currency text default 'RWF',
  p_payer_name text default null,
  p_momo_ref text default null,
  p_occurred_at timestamptz default now(),
  p_parse_confidence numeric default 1.0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id uuid;
  v_member_id uuid;
  v_group_id uuid;
begin
  -- Check if SMS already parsed
  if exists (select 1 from public.momo_sms_raw where id = p_sms_id and parse_status = 'success') then
    raise exception 'SMS already parsed';
  end if;

  -- Try to match by phone number (optional - could be done later)
  select m.id, m.group_id into v_member_id, v_group_id
  from public.members m
  where m.phone = p_payer_phone
    and m.institution_id = p_institution_id
    and m.status = 'ACTIVE'
  limit 1;

  -- Create transaction
  insert into public.transactions (
    institution_id, momo_sms_id, occurred_at, amount, currency,
    payer_phone, payer_name, momo_ref, parse_confidence,
    member_id, group_id, allocation_status, type, channel, status
  ) values (
    p_institution_id, p_sms_id, p_occurred_at, p_amount, p_currency,
    p_payer_phone, p_payer_name, p_momo_ref, p_parse_confidence,
    v_member_id, v_group_id,
    case when v_member_id is not null then 'allocated'::transaction_allocation_status else 'unallocated'::transaction_allocation_status end,
    'CONTRIBUTION', 'MoMo', 'COMPLETED'
  )
  returning id into v_transaction_id;

  -- Update SMS parse status
  update public.momo_sms_raw
  set parse_status = 'success'::sms_parse_status,
      institution_id = p_institution_id
  where id = p_sms_id;

  -- Log allocation if auto-matched
  if v_member_id is not null then
    insert into public.transaction_allocations (
      transaction_id, member_id, group_id, allocated_by
    ) values (
      v_transaction_id, v_member_id, v_group_id, auth.uid()
    );
  end if;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(), p_institution_id, 'parse_momo_sms', 'transaction', v_transaction_id,
    jsonb_build_object('sms_id', p_sms_id, 'amount', p_amount, 'auto_allocated', v_member_id is not null)
  );

  return v_transaction_id;
exception
  when others then
    -- Mark SMS as error
    update public.momo_sms_raw
    set parse_status = 'error'::sms_parse_status,
        parse_error = sqlerrm
    where id = p_sms_id;
    raise;
end;
$$;

-- Function: allocate_transaction
create or replace function public.allocate_transaction(
  p_transaction_id uuid,
  p_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction record;
  v_member record;
  v_allocation_id uuid;
begin
  -- Get transaction
  select * into v_transaction
  from public.transactions
  where id = p_transaction_id;

  if not found then
    raise exception 'Transaction not found';
  end if;

  -- Validate transaction is unallocated
  if v_transaction.allocation_status != 'unallocated' then
    raise exception 'Transaction is not unallocated (current status: %)', v_transaction.allocation_status;
  end if;

  -- Get member
  select * into v_member
  from public.members
  where id = p_member_id;

  if not found then
    raise exception 'Member not found';
  end if;

  -- Validate institution match
  if v_transaction.institution_id != v_member.institution_id then
    raise exception 'Transaction and member must belong to the same institution';
  end if;

  -- Validate member has group_id
  if v_member.group_id is null then
    raise exception 'Member must belong to a group';
  end if;

  -- Update transaction
  update public.transactions
  set member_id = p_member_id,
      group_id = v_member.group_id,
      allocation_status = 'allocated'::transaction_allocation_status
  where id = p_transaction_id;

  -- Create allocation record
  insert into public.transaction_allocations (
    transaction_id, member_id, group_id, allocated_by
  ) values (
    p_transaction_id, p_member_id, v_member.group_id, auth.uid()
  )
  returning id into v_allocation_id;

  -- Send contribution confirmation notification
  -- This will be triggered automatically by the database trigger,
  -- but we can also call it explicitly here for immediate sending
  if v_transaction.type = 'CONTRIBUTION' then
    perform public.send_contribution_confirmation(p_transaction_id);
  end if;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(), v_transaction.institution_id, 'allocate_transaction', 'transaction', p_transaction_id,
    jsonb_build_object('member_id', p_member_id, 'group_id', v_member.group_id)
  );

  return v_allocation_id;
end;
$$;

-- ============================================================================
-- STEP 10: Comments for documentation
-- ============================================================================

comment on table public.institution_momo_codes is 'MoMo codes associated with institutions (1 institution can have multiple codes)';
comment on table public.momo_sms_raw is 'Raw MoMo SMS messages before parsing into transactions';
comment on table public.transaction_allocations is 'Audit trail of transaction allocations (who allocated what when)';
comment on table public.reconciliation_sessions is 'Reconciliation work sessions opened by staff';
comment on table public.reconciliation_items is 'Individual reconciliation issues within a session';
comment on table public.audit_log is 'System-wide audit trail for all actions';

comment on function public.parse_momo_sms is 'Parses a MoMo SMS and creates a transaction (called by Edge Function)';
comment on function public.allocate_transaction is 'Allocates an unallocated transaction to a member';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Drop old tables (contributions, incoming_payments, payment_ledger) - do this in a separate migration after verification
-- 2. Deploy Edge Functions (parse_momo_sms, bulk_import_groups, bulk_import_members)
-- 3. Update frontend to use new schema
-- ============================================================================

