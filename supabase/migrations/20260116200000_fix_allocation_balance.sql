-- ============================================================================
-- Migration: Fix Transaction Allocation & Balance Updates
-- Date: 2026-01-15
-- Purpose: 
--   1. Update allocate_transaction RPC to update member and group balances
--   2. Fix vw_transactions_consolidated view (source_sms_id reference)
--   3. Add suggest_member_for_transaction RPC for phone-based matching
--   4. Add auto_allocate setting to institution_settings
-- ============================================================================

-- ============================================================================
-- STEP 1: Add auto_allocate setting to institution_settings
-- ============================================================================

alter table public.institution_settings
  add column if not exists auto_allocate_enabled boolean not null default false;

comment on column public.institution_settings.auto_allocate_enabled is 
  'When true, system will auto-suggest members for allocation based on phone matching';

-- ============================================================================
-- STEP 2: Update allocate_transaction RPC with balance updates
-- ============================================================================

-- Drop existing function to recreate with enhanced logic
drop function if exists public.allocate_transaction(uuid, uuid, text);

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
  v_group record;
  v_result jsonb;
  v_balance_updated boolean := false;
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
  
  -- Get member
  select * into v_member
  from public.members
  where id = p_member_id;
  
  if v_member is null then
    raise exception 'Member not found';
  end if;
  
  -- Validate member is in same institution
  if v_member.institution_id != v_transaction.institution_id then
    raise exception 'Member belongs to a different institution';
  end if;
  
  -- Get member's group (if assigned via group_members)
  select gm.group_id, g.group_name
  into v_group
  from public.group_members gm
  join public.groups g on g.id = gm.group_id
  where gm.member_id = p_member_id
    and g.status = 'ACTIVE'
  limit 1;
  
  -- ============================================================================
  -- CRITICAL: Update member savings_balance
  -- ============================================================================
  update public.members
  set savings_balance = savings_balance + v_transaction.amount
  where id = p_member_id;
  
  v_balance_updated := true;
  
  -- ============================================================================
  -- CRITICAL: Update group fund_balance (if member belongs to a group)
  -- ============================================================================
  if v_group.group_id is not null then
    update public.groups
    set fund_balance = fund_balance + v_transaction.amount
    where id = v_group.group_id;
  end if;
  
  -- Update transaction with allocation info
  update public.transactions
  set 
    member_id = p_member_id,
    group_id = v_group.group_id,
    allocation_status = 'allocated',
    allocated_by = auth.uid(),
    allocated_at = now(),
    allocation_note = p_note
  where id = p_transaction_id;
  
  -- Create allocation record in transaction_allocations (if table exists)
  begin
    insert into public.transaction_allocations (
      transaction_id, member_id, group_id, allocated_by, notes
    ) values (
      p_transaction_id, p_member_id, v_group.group_id, auth.uid(), p_note
    );
  exception when undefined_table then
    -- Table doesn't exist, skip
    null;
  end;
  
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
      'group_id', v_group.group_id,
      'group_name', v_group.group_name,
      'amount', v_transaction.amount,
      'currency', v_transaction.currency,
      'balance_updated', v_balance_updated,
      'new_member_balance', v_member.savings_balance + v_transaction.amount,
      'note', p_note
    )
  );
  
  -- Return success with details
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', p_transaction_id,
    'member_id', p_member_id,
    'member_name', v_member.full_name,
    'group_id', v_group.group_id,
    'group_name', v_group.group_name,
    'amount', v_transaction.amount,
    'balance_updated', v_balance_updated,
    'new_member_balance', v_member.savings_balance + v_transaction.amount,
    'allocated_at', now()
  );
  
  return v_result;
end;
$$;

grant execute on function public.allocate_transaction(uuid, uuid, text) to authenticated;

comment on function public.allocate_transaction(uuid, uuid, text) is 
  'Allocates an unallocated transaction to a member. Updates member savings_balance and group fund_balance.';

-- ============================================================================
-- STEP 3: Create suggest_member_for_transaction RPC
-- ============================================================================

create or replace function public.suggest_member_for_transaction(
  p_transaction_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_transaction record;
  v_member record;
  v_normalized_phone text;
begin
  -- Get transaction
  select * into v_transaction
  from public.transactions
  where id = p_transaction_id;
  
  if v_transaction is null then
    return jsonb_build_object('success', false, 'error', 'Transaction not found');
  end if;
  
  -- If no payer phone, can't suggest
  if v_transaction.payer_phone is null or trim(v_transaction.payer_phone) = '' then
    return jsonb_build_object(
      'success', true, 
      'suggested_member', null,
      'reason', 'No payer phone available'
    );
  end if;
  
  -- Normalize phone (remove non-digits, handle country code)
  v_normalized_phone := regexp_replace(v_transaction.payer_phone, '[^0-9]', '', 'g');
  
  -- Remove leading country code if present (250 for Rwanda)
  if length(v_normalized_phone) > 9 and v_normalized_phone like '250%' then
    v_normalized_phone := substring(v_normalized_phone from 4);
  end if;
  
  -- Try to find member with matching phone
  select m.id, m.full_name, m.phone, m.savings_balance,
         gm.group_id, g.group_name
  into v_member
  from public.members m
  left join public.group_members gm on gm.member_id = m.id
  left join public.groups g on g.id = gm.group_id and g.status = 'ACTIVE'
  where m.institution_id = v_transaction.institution_id
    and m.status = 'ACTIVE'
    and (
      -- Match on full phone
      regexp_replace(m.phone, '[^0-9]', '', 'g') = v_normalized_phone
      -- Or match on last 9 digits
      or right(regexp_replace(m.phone, '[^0-9]', '', 'g'), 9) = right(v_normalized_phone, 9)
    )
  limit 1;
  
  if v_member is null then
    return jsonb_build_object(
      'success', true,
      'suggested_member', null,
      'reason', 'No matching member found for phone: ' || v_transaction.payer_phone
    );
  end if;
  
  return jsonb_build_object(
    'success', true,
    'suggested_member', jsonb_build_object(
      'id', v_member.id,
      'full_name', v_member.full_name,
      'phone', v_member.phone,
      'savings_balance', v_member.savings_balance,
      'group_id', v_member.group_id,
      'group_name', v_member.group_name
    ),
    'match_type', 'phone',
    'matched_phone', v_transaction.payer_phone
  );
end;
$$;

grant execute on function public.suggest_member_for_transaction(uuid) to authenticated;

comment on function public.suggest_member_for_transaction is 
  'Suggests a member for allocation based on phone number matching from transaction payer_phone';

-- ============================================================================
-- STEP 4: Fix vw_transactions_consolidated view
-- ============================================================================

drop view if exists public.vw_transactions_consolidated;

create or replace view public.vw_transactions_consolidated as
select 
  t.id,
  t.institution_id,
  t.occurred_at,
  t.created_at,
  t.amount,
  t.currency,
  t.payer_phone,
  t.payer_name,
  t.momo_ref,
  t.type as transaction_type,
  t.channel,
  t.status as transaction_status,
  t.allocation_status,
  t.member_id,
  t.group_id,
  t.parse_confidence,
  t.allocated_by,
  t.allocated_at,
  t.allocation_note,
  -- SMS source info (using correct FK column name)
  sms.id as sms_id,
  sms.sms_text,
  sms.sender_phone,
  sms.received_at as sms_received_at,
  sms.parse_status,
  sms.parse_error,
  sms.source as sms_source,
  -- Member info (if allocated)
  m.full_name as member_name,
  m.phone as member_phone,
  m.savings_balance as member_balance,
  -- Group info (if allocated)
  g.group_name,
  g.fund_balance as group_balance,
  -- Allocated by user info
  p.full_name as allocated_by_name
from public.transactions t
left join public.momo_sms_raw sms on t.source_sms_id = sms.id
left join public.members m on t.member_id = m.id
left join public.groups g on t.group_id = g.id
left join public.profiles p on t.allocated_by = p.user_id
order by t.occurred_at desc;

comment on view public.vw_transactions_consolidated is 
  'Consolidated view of transactions with SMS source, member, group, and allocation details';

grant select on public.vw_transactions_consolidated to authenticated;
grant select on public.vw_transactions_consolidated to service_role;

-- ============================================================================
-- STEP 5: Create RPC to fetch consolidated transactions
-- ============================================================================

create or replace function public.get_consolidated_transactions(
  p_institution_id uuid,
  p_allocation_status text default null,
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_result jsonb;
  v_count int;
begin
  -- Get total count
  select count(*) into v_count
  from public.vw_transactions_consolidated
  where institution_id = p_institution_id
    and (p_allocation_status is null or allocation_status = p_allocation_status);
  
  -- Get data
  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_result
  from (
    select *
    from public.vw_transactions_consolidated
    where institution_id = p_institution_id
      and (p_allocation_status is null or allocation_status = p_allocation_status)
    order by occurred_at desc
    limit p_limit
    offset p_offset
  ) t;
  
  return jsonb_build_object(
    'success', true,
    'data', v_result,
    'total', v_count,
    'limit', p_limit,
    'offset', p_offset
  );
end;
$$;

grant execute on function public.get_consolidated_transactions(uuid, text, int, int) to authenticated;

comment on function public.get_consolidated_transactions is 
  'Fetches consolidated transaction data with optional allocation status filter';

-- ============================================================================
-- End of migration
-- ============================================================================
