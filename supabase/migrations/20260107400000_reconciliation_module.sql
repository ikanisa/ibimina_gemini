-- ============================================================================
-- Migration: Reconciliation Module
-- Purpose: Add duplicate tracking, SMS resolution, and RPCs for reconciliation
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure required columns exist on transactions
-- ============================================================================

-- Add momo_tx_id if not exists (needed for duplicate detection)
alter table public.transactions 
  add column if not exists momo_tx_id text;

-- Add momo_ref if not exists
alter table public.transactions 
  add column if not exists momo_ref text;

-- Add payer_phone if not exists
alter table public.transactions 
  add column if not exists payer_phone text;

-- Add payer_name if not exists  
alter table public.transactions 
  add column if not exists payer_name text;

-- Add occurred_at if not exists
alter table public.transactions 
  add column if not exists occurred_at timestamptz default now();

-- Add parse_confidence if not exists
alter table public.transactions 
  add column if not exists parse_confidence numeric(3,2) default 1.0;

-- Add source_sms_id if not exists
alter table public.transactions 
  add column if not exists source_sms_id uuid;

-- ============================================================================
-- STEP 2: Add columns to transactions for duplicate tracking
-- ============================================================================

-- Add canonical_transaction_id for linking duplicates to their canonical version
alter table public.transactions 
  add column if not exists canonical_transaction_id uuid references public.transactions(id) on delete set null;

-- Add duplicate_reason for documenting why a transaction was marked as duplicate
alter table public.transactions 
  add column if not exists duplicate_reason text;

-- Add flag_reason for documenting why a transaction was flagged
alter table public.transactions 
  add column if not exists flag_reason text;

-- Add updated tracking
alter table public.transactions 
  add column if not exists updated_at timestamptz;
alter table public.transactions 
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

comment on column public.transactions.canonical_transaction_id is 'FK to the canonical transaction when this is a duplicate';
comment on column public.transactions.duplicate_reason is 'Reason why this transaction was marked as duplicate';
comment on column public.transactions.flag_reason is 'Reason for flagging (if status=flagged)';

-- ============================================================================
-- STEP 3: Add columns to momo_sms_raw for resolution tracking
-- ============================================================================

-- Resolution status for parse errors
do $$
begin
  if not exists (select 1 from pg_type where typname = 'sms_resolution_status') then
    create type sms_resolution_status as enum (
      'open',
      'ignored',
      'not_payment',
      'retried',
      'resolved'
    );
  end if;
end $$;

-- Add resolution columns (these may fail if momo_sms_raw doesn't exist - that's OK)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'momo_sms_raw') then
    -- Add resolution_status
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'momo_sms_raw' and column_name = 'resolution_status') then
      alter table public.momo_sms_raw add column resolution_status text default 'open' check (resolution_status in ('open', 'ignored', 'not_payment', 'retried', 'resolved'));
    end if;
    
    -- Add resolution_note
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'momo_sms_raw' and column_name = 'resolution_note') then
      alter table public.momo_sms_raw add column resolution_note text;
    end if;
    
    -- Add resolved_by
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'momo_sms_raw' and column_name = 'resolved_by') then
      alter table public.momo_sms_raw add column resolved_by uuid references auth.users(id) on delete set null;
    end if;
    
    -- Add resolved_at
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'momo_sms_raw' and column_name = 'resolved_at') then
      alter table public.momo_sms_raw add column resolved_at timestamptz;
    end if;
  end if;
end $$;

-- ============================================================================
-- STEP 4: Add indexes for reconciliation queries
-- ============================================================================

-- Index for finding duplicates by momo_tx_id
create index if not exists idx_transactions_institution_momo_tx_id 
  on public.transactions(institution_id, momo_tx_id) 
  where momo_tx_id is not null;

-- Index for fingerprint-based duplicate detection (amount + payer_phone + time window)
create index if not exists idx_transactions_fingerprint 
  on public.transactions(institution_id, amount, payer_phone, occurred_at);

-- Index for canonical transaction lookups
create index if not exists idx_transactions_canonical 
  on public.transactions(canonical_transaction_id) 
  where canonical_transaction_id is not null;

-- Index for unresolved SMS errors (conditional on momo_sms_raw existing)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'momo_sms_raw') then
    create index if not exists idx_momo_sms_raw_resolution 
      on public.momo_sms_raw(institution_id, parse_status, resolution_status);
  end if;
end $$;

-- ============================================================================
-- STEP 5: Create duplicate candidates view
-- ============================================================================

-- View to find duplicate candidates based on momo_tx_id or fingerprint
create or replace view public.vw_duplicate_candidates as
with 
-- Duplicates by momo_tx_id (exact match)
momo_id_dupes as (
  select 
    t.institution_id,
    t.momo_tx_id as match_key,
    array_agg(t.id order by t.occurred_at) as transaction_ids,
    count(*) as dupe_count,
    'momo_tx_id' as match_type
  from public.transactions t
  where t.momo_tx_id is not null
    and t.allocation_status != 'duplicate'
  group by t.institution_id, t.momo_tx_id
  having count(*) > 1
),
-- Duplicates by fingerprint (amount + payer_phone within dedupe window)
fingerprint_dupes as (
  select 
    t1.institution_id,
    t1.id as transaction_id_1,
    t2.id as transaction_id_2,
    t1.amount,
    t1.payer_phone,
    t1.occurred_at as occurred_at_1,
    t2.occurred_at as occurred_at_2,
    abs(extract(epoch from (t2.occurred_at - t1.occurred_at)) / 60) as minutes_apart
  from public.transactions t1
  join public.transactions t2 
    on t1.institution_id = t2.institution_id
    and t1.amount = t2.amount
    and t1.payer_phone = t2.payer_phone
    and t1.payer_phone is not null
    and t1.id < t2.id  -- avoid self-joins and duplicates
    and t1.allocation_status != 'duplicate'
    and t2.allocation_status != 'duplicate'
    and abs(extract(epoch from (t2.occurred_at - t1.occurred_at)) / 60) <= 60  -- default 60 min window
),
-- Combine fingerprint dupes into groups
fingerprint_groups as (
  select 
    institution_id,
    amount::text || '|' || payer_phone as match_key,
    array_agg(distinct transaction_id_1) || array_agg(distinct transaction_id_2) as raw_ids
  from fingerprint_dupes
  group by institution_id, amount, payer_phone
)
-- Final result: momo_tx_id duplicates
select 
  institution_id,
  match_key,
  match_type,
  transaction_ids,
  dupe_count
from momo_id_dupes

union all

-- Final result: fingerprint duplicates (deduplicated)
select 
  fg.institution_id,
  fg.match_key,
  'fingerprint' as match_type,
  (select array_agg(distinct id order by id) 
   from unnest(fg.raw_ids) as id) as transaction_ids,
  (select count(distinct id) from unnest(fg.raw_ids) as id)::bigint as dupe_count
from fingerprint_groups fg;

comment on view public.vw_duplicate_candidates is 'View of potential duplicate transactions by momo_tx_id or fingerprint';

-- Grant view access
grant select on public.vw_duplicate_candidates to authenticated;

-- ============================================================================
-- STEP 6: RPC - retry_parse_sms
-- ============================================================================

create or replace function public.retry_parse_sms(
  p_sms_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms record;
  v_user_id uuid;
  v_user_institution_id uuid;
  v_settings record;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Get the SMS record
  select * into v_sms
  from public.momo_sms_raw
  where id = p_sms_id;
  
  if v_sms.id is null then
    raise exception 'SMS record not found';
  end if;
  
  -- Check institution access (platform admin or same institution)
  if not public.is_platform_admin() and v_sms.institution_id != v_user_institution_id then
    raise exception 'Access denied: SMS belongs to different institution';
  end if;
  
  -- Get institution settings for parsing mode
  select * into v_settings
  from public.institution_settings
  where institution_id = coalesce(v_sms.institution_id, v_user_institution_id);
  
  -- Reset SMS to pending for re-parsing
  update public.momo_sms_raw
  set 
    parse_status = 'pending',
    parse_error = null,
    resolution_status = 'retried',
    resolution_note = 'Retry requested at ' || now()::text,
    resolved_by = v_user_id,
    resolved_at = now()
  where id = p_sms_id;
  
  -- Log to audit
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id,
    coalesce(v_sms.institution_id, v_user_institution_id),
    'retry_parse_sms',
    'momo_sms_raw',
    p_sms_id,
    jsonb_build_object(
      'previous_status', v_sms.parse_status,
      'previous_error', v_sms.parse_error
    )
  );
  
  -- Return info for Edge Function to process
  return jsonb_build_object(
    'success', true,
    'sms_id', p_sms_id,
    'sms_text', v_sms.sms_text,
    'sender_phone', v_sms.sender_phone,
    'institution_id', coalesce(v_sms.institution_id, v_user_institution_id),
    'parsing_mode', coalesce(v_settings.parsing_mode, 'deterministic')
  );
end;
$$;

comment on function public.retry_parse_sms is 'Retries parsing of an SMS that previously failed';

-- ============================================================================
-- STEP 7: RPC - resolve_sms_error
-- ============================================================================

create or replace function public.resolve_sms_error(
  p_sms_id uuid,
  p_resolution text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms record;
  v_user_id uuid;
  v_user_institution_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Validate resolution value
  if p_resolution not in ('ignored', 'not_payment', 'resolved') then
    raise exception 'Invalid resolution. Must be: ignored, not_payment, or resolved';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Get the SMS record
  select * into v_sms
  from public.momo_sms_raw
  where id = p_sms_id;
  
  if v_sms.id is null then
    raise exception 'SMS record not found';
  end if;
  
  -- Check institution access
  if not public.is_platform_admin() and v_sms.institution_id != v_user_institution_id then
    raise exception 'Access denied: SMS belongs to different institution';
  end if;
  
  -- Check SMS is in error state
  if v_sms.parse_status != 'error' then
    raise exception 'SMS is not in error state';
  end if;
  
  -- Update SMS resolution
  update public.momo_sms_raw
  set 
    resolution_status = p_resolution,
    resolution_note = p_note,
    resolved_by = v_user_id,
    resolved_at = now()
  where id = p_sms_id;
  
  -- Log to audit
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id,
    coalesce(v_sms.institution_id, v_user_institution_id),
    'resolve_sms_error',
    'momo_sms_raw',
    p_sms_id,
    jsonb_build_object(
      'resolution', p_resolution,
      'note', p_note,
      'previous_error', v_sms.parse_error
    )
  );
end;
$$;

comment on function public.resolve_sms_error is 'Resolves a parse error by marking it as ignored/not_payment/resolved';

-- ============================================================================
-- STEP 8: RPC - mark_transaction_duplicate
-- ============================================================================

create or replace function public.mark_transaction_duplicate(
  p_transaction_id uuid,
  p_canonical_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction public.transactions;
  v_canonical public.transactions;
  v_user_id uuid;
  v_user_institution_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution
  select institution_id into v_user_institution_id
  from public.profiles
  where user_id = v_user_id;
  
  -- Get the transaction to be marked as duplicate
  select * into v_transaction
  from public.transactions
  where id = p_transaction_id;
  
  if v_transaction.id is null then
    raise exception 'Transaction not found';
  end if;
  
  -- Get the canonical transaction
  select * into v_canonical
  from public.transactions
  where id = p_canonical_id;
  
  if v_canonical.id is null then
    raise exception 'Canonical transaction not found';
  end if;
  
  -- Validate same institution
  if v_transaction.institution_id != v_canonical.institution_id then
    raise exception 'Transactions must belong to same institution';
  end if;
  
  -- Check institution access
  if not public.is_platform_admin() and v_transaction.institution_id != v_user_institution_id then
    raise exception 'Access denied: Transaction belongs to different institution';
  end if;
  
  -- Validate not marking canonical as its own duplicate
  if p_transaction_id = p_canonical_id then
    raise exception 'Cannot mark transaction as duplicate of itself';
  end if;
  
  -- Validate canonical is not already a duplicate
  if v_canonical.allocation_status = 'duplicate' then
    raise exception 'Canonical transaction is itself a duplicate';
  end if;
  
  -- Update transaction as duplicate
  update public.transactions
  set 
    allocation_status = 'duplicate',
    canonical_transaction_id = p_canonical_id,
    duplicate_reason = p_reason,
    updated_at = now(),
    updated_by = v_user_id
  where id = p_transaction_id;
  
  -- Log to audit
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    v_user_id,
    v_transaction.institution_id,
    'mark_transaction_duplicate',
    'transaction',
    p_transaction_id,
    jsonb_build_object(
      'canonical_id', p_canonical_id,
      'reason', p_reason,
      'previous_status', v_transaction.allocation_status
    )
  );
end;
$$;

comment on function public.mark_transaction_duplicate is 'Marks a transaction as duplicate and links to canonical transaction';

-- ============================================================================
-- STEP 9: Grant permissions
-- ============================================================================

grant execute on function public.retry_parse_sms(uuid) to authenticated;
grant execute on function public.resolve_sms_error(uuid, text, text) to authenticated;
grant execute on function public.mark_transaction_duplicate(uuid, uuid, text) to authenticated;

-- ============================================================================
-- STEP 10: Trigger to update updated_at on transactions
-- ============================================================================

create or replace function public.update_transaction_timestamp()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_transaction_updated_at on public.transactions;
create trigger trigger_transaction_updated_at
  before update on public.transactions
  for each row
  execute function public.update_transaction_timestamp();

-- ============================================================================
-- End of migration
-- ============================================================================
