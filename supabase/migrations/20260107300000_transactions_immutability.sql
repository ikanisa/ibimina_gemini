-- ============================================================================
-- TRANSACTIONS IMMUTABILITY + INDEXES
-- Date: 2026-01-07
-- Purpose: Enforce transaction fact immutability and add performance indexes
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing indexes for transaction queries
-- ============================================================================

-- Index for filtering by member
create index if not exists idx_transactions_institution_member_occurred
  on public.transactions(institution_id, member_id, occurred_at desc);

-- Index for filtering by group
create index if not exists idx_transactions_institution_group_occurred
  on public.transactions(institution_id, group_id, occurred_at desc);

-- Index for payer phone lookups (for auto-allocation matching)
create index if not exists idx_transactions_institution_payer_phone
  on public.transactions(institution_id, payer_phone);

-- ============================================================================
-- STEP 2: Add allocated_by, allocated_at, allocation_note to transactions
-- (Simple allocation metadata - in addition to transaction_allocations table)
-- ============================================================================

alter table public.transactions
  add column if not exists allocated_by uuid references auth.users(id) on delete set null,
  add column if not exists allocated_at timestamptz,
  add column if not exists allocation_note text;

-- ============================================================================
-- STEP 3: Create immutability trigger
-- Prevents modification of transaction facts after insert
-- Only allows changes to: allocation fields, status, notes/flags
-- ============================================================================

create or replace function public.enforce_transaction_immutability()
returns trigger
language plpgsql
security definer
as $$
begin
  -- List of immutable columns (transaction facts)
  if OLD.amount is distinct from NEW.amount then
    raise exception 'Cannot modify transaction amount (immutable fact)';
  end if;
  
  if OLD.occurred_at is distinct from NEW.occurred_at then
    raise exception 'Cannot modify transaction occurred_at (immutable fact)';
  end if;
  
  if OLD.payer_phone is distinct from NEW.payer_phone then
    raise exception 'Cannot modify transaction payer_phone (immutable fact)';
  end if;
  
  if OLD.payer_name is distinct from NEW.payer_name then
    raise exception 'Cannot modify transaction payer_name (immutable fact)';
  end if;
  
  if OLD.momo_ref is distinct from NEW.momo_ref then
    raise exception 'Cannot modify transaction momo_ref (immutable fact)';
  end if;
  
  if OLD.momo_sms_id is distinct from NEW.momo_sms_id then
    raise exception 'Cannot modify transaction momo_sms_id (immutable fact)';
  end if;
  
  if OLD.currency is distinct from NEW.currency then
    raise exception 'Cannot modify transaction currency (immutable fact)';
  end if;
  
  if OLD.institution_id is distinct from NEW.institution_id then
    raise exception 'Cannot modify transaction institution_id (immutable fact)';
  end if;
  
  if OLD.parse_confidence is distinct from NEW.parse_confidence then
    raise exception 'Cannot modify transaction parse_confidence (immutable fact)';
  end if;
  
  -- These columns CAN be modified:
  -- member_id, group_id, allocation_status, allocated_by, allocated_at, allocation_note
  -- status (transaction status like COMPLETED, REVERSED), type, channel, reference
  
  return NEW;
end;
$$;

-- Create the trigger (drop first if exists to avoid duplicates)
drop trigger if exists trigger_transaction_immutability on public.transactions;

create trigger trigger_transaction_immutability
  before update on public.transactions
  for each row
  execute function public.enforce_transaction_immutability();

-- ============================================================================
-- STEP 4: Update allocate_transaction to set allocated_by/at
-- ============================================================================

-- Drop old version with 2 parameters to avoid ambiguity
drop function if exists public.allocate_transaction(uuid, uuid);

create or replace function public.allocate_transaction(
  p_transaction_id uuid,
  p_member_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction record;
  v_member record;
  v_result jsonb;
begin
  -- Get transaction
  select * into v_transaction
  from public.transactions
  where id = p_transaction_id;
  
  if v_transaction is null then
    raise exception 'Transaction not found';
  end if;
  
  -- Validate transaction is unallocated
  if v_transaction.allocation_status != 'unallocated' then
    raise exception 'Transaction is already allocated (status: %)', v_transaction.allocation_status;
  end if;
  
  -- Get member with group
  select m.*, g.id as group_id, g.name as group_name
  into v_member
  from public.members m
  left join public.groups g on m.group_id = g.id
  where m.id = p_member_id;
  
  if v_member is null then
    raise exception 'Member not found';
  end if;
  
  -- Validate member is in same institution
  if v_member.institution_id != v_transaction.institution_id then
    raise exception 'Member belongs to a different institution';
  end if;
  
  -- Update transaction (immutability trigger allows allocation fields)
  update public.transactions
  set 
    member_id = p_member_id,
    group_id = v_member.group_id,
    allocation_status = 'allocated',
    allocated_by = auth.uid(),
    allocated_at = now(),
    allocation_note = p_note
  where id = p_transaction_id;
  
  -- Create allocation record in transaction_allocations
  insert into public.transaction_allocations (
    transaction_id, member_id, group_id, allocated_by, notes
  ) values (
    p_transaction_id, p_member_id, v_member.group_id, auth.uid(), p_note
  );
  
  -- Create audit log entry
  insert into public.audit_log (
    actor_user_id, actor_email, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    (select email from public.profiles where user_id = auth.uid()),
    v_transaction.institution_id,
    'allocate_transaction',
    'transaction',
    p_transaction_id::text,
    jsonb_build_object(
      'member_id', p_member_id,
      'member_name', v_member.full_name,
      'group_id', v_member.group_id,
      'group_name', v_member.group_name,
      'amount', v_transaction.amount,
      'note', p_note
    )
  );
  
  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', p_transaction_id,
    'member_id', p_member_id,
    'member_name', v_member.full_name,
    'group_id', v_member.group_id,
    'group_name', v_member.group_name,
    'allocated_at', now()
  );
  
  return v_result;
end;
$$;

-- Drop old version of function (2 params) if exists
drop function if exists public.allocate_transaction(uuid, uuid);

-- Grant execute permission
grant execute on function public.allocate_transaction(uuid, uuid, text) to authenticated;

comment on function public.allocate_transaction(uuid, uuid, text) is 
  'Allocates an unallocated transaction to a member. Validates institution match, updates transaction, creates audit trail.';

-- ============================================================================
-- STEP 5: Add function to get transaction with full details
-- ============================================================================

create or replace function public.get_transaction_details(p_transaction_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'transaction', row_to_json(t),
    'member', case when t.member_id is not null then (
      select row_to_json(m) from public.members m where m.id = t.member_id
    ) else null end,
    'group', case when t.group_id is not null then (
      select row_to_json(g) from public.groups g where g.id = t.group_id
    ) else null end,
    'source_sms', case when t.momo_sms_id is not null then (
      select row_to_json(s) from public.momo_sms_raw s where s.id = t.momo_sms_id
    ) else null end,
    'allocations', (
      select coalesce(jsonb_agg(row_to_json(a) order by a.allocated_at desc), '[]'::jsonb)
      from public.transaction_allocations a
      where a.transaction_id = t.id
    ),
    'allocated_by_user', case when t.allocated_by is not null then (
      select jsonb_build_object('id', p.user_id, 'email', p.email, 'full_name', p.full_name)
      from public.profiles p where p.user_id = t.allocated_by
    ) else null end
  ) into v_result
  from public.transactions t
  where t.id = p_transaction_id;
  
  return v_result;
end;
$$;

grant execute on function public.get_transaction_details(uuid) to authenticated;

comment on function public.get_transaction_details is 
  'Returns full transaction details including member, group, source SMS, and allocation history.';

