-- ============================================================================
-- Migration: Reports Module
-- Purpose: Create views and RPCs for institution/group/member reports
-- Minimalist approach: derive everything from transactions + allocation data
-- ============================================================================

-- ============================================================================
-- STEP 1: Add/confirm indexes for report queries
-- ============================================================================

-- Transaction indexes for date-based reporting
create index if not exists idx_transactions_institution_occurred_at 
  on public.transactions(institution_id, occurred_at desc);

create index if not exists idx_transactions_institution_allocation_status_occurred_at 
  on public.transactions(institution_id, allocation_status, occurred_at desc);

create index if not exists idx_transactions_institution_group_id_occurred_at 
  on public.transactions(institution_id, group_id, occurred_at desc)
  where group_id is not null;

create index if not exists idx_transactions_institution_member_id_occurred_at 
  on public.transactions(institution_id, member_id, occurred_at desc)
  where member_id is not null;

-- Group/Member indexes for aggregation
create index if not exists idx_members_institution_group_id 
  on public.members(institution_id, group_id)
  where group_id is not null;

create index if not exists idx_groups_institution_id 
  on public.groups(institution_id);

-- ============================================================================
-- STEP 2: Create enriched transactions view
-- Joins transactions with members, groups, institutions for reporting
-- ============================================================================

create or replace view public.vw_transactions_enriched as
select
  t.id,
  t.institution_id,
  t.member_id,
  t.group_id,
  t.amount,
  t.currency,
  t.type,
  t.channel,
  t.status,
  t.allocation_status,
  t.reference,
  t.momo_ref,
  t.momo_tx_id,
  t.payer_phone,
  t.payer_name,
  t.occurred_at,
  t.created_at,
  t.source_sms_id,
  t.parse_confidence,
  t.allocated_by,
  t.allocated_at,
  t.allocation_note,
  -- Member info
  m.full_name as member_name,
  m.phone as member_phone,
  m.member_code,
  -- Group info
  g.group_name,
  g.group_code,
  -- Institution info
  i.name as institution_name,
  i.code as institution_code
from public.transactions t
left join public.members m on m.id = t.member_id
left join public.groups g on g.id = t.group_id
left join public.institutions i on i.id = t.institution_id;

comment on view public.vw_transactions_enriched is 'Enriched transactions with member, group, and institution details for reporting';

grant select on public.vw_transactions_enriched to authenticated;

-- ============================================================================
-- STEP 3: Create daily aggregation views
-- ============================================================================

-- Institution totals by date
create or replace view public.vw_institution_totals_daily as
select
  t.institution_id,
  date_trunc('day', t.occurred_at)::date as report_date,
  count(*) as transaction_count,
  sum(t.amount) as total_amount,
  count(*) filter (where t.allocation_status = 'allocated') as allocated_count,
  sum(t.amount) filter (where t.allocation_status = 'allocated') as allocated_amount,
  count(*) filter (where t.allocation_status = 'unallocated') as unallocated_count,
  sum(t.amount) filter (where t.allocation_status = 'unallocated') as unallocated_amount,
  count(*) filter (where t.allocation_status = 'duplicate') as duplicate_count,
  count(*) filter (where t.allocation_status = 'error') as error_count
from public.transactions t
where t.occurred_at is not null
group by t.institution_id, date_trunc('day', t.occurred_at)::date;

comment on view public.vw_institution_totals_daily is 'Daily transaction totals by institution';

grant select on public.vw_institution_totals_daily to authenticated;

-- Group totals by date
create or replace view public.vw_group_totals_daily as
select
  t.institution_id,
  t.group_id,
  g.group_name,
  g.group_code,
  date_trunc('day', t.occurred_at)::date as report_date,
  count(*) as transaction_count,
  sum(t.amount) as total_amount,
  count(*) filter (where t.allocation_status = 'allocated') as allocated_count,
  sum(t.amount) filter (where t.allocation_status = 'allocated') as allocated_amount,
  count(*) filter (where t.allocation_status = 'unallocated') as unallocated_count,
  sum(t.amount) filter (where t.allocation_status = 'unallocated') as unallocated_amount
from public.transactions t
join public.groups g on g.id = t.group_id
where t.occurred_at is not null and t.group_id is not null
group by t.institution_id, t.group_id, g.group_name, g.group_code, date_trunc('day', t.occurred_at)::date;

comment on view public.vw_group_totals_daily is 'Daily transaction totals by group';

grant select on public.vw_group_totals_daily to authenticated;

-- Member totals by date
create or replace view public.vw_member_totals_daily as
select
  t.institution_id,
  t.member_id,
  t.group_id,
  m.full_name as member_name,
  m.member_code,
  m.phone as member_phone,
  g.group_name,
  date_trunc('day', t.occurred_at)::date as report_date,
  count(*) as transaction_count,
  sum(t.amount) as total_amount,
  max(t.occurred_at) as last_transaction_at
from public.transactions t
join public.members m on m.id = t.member_id
left join public.groups g on g.id = t.group_id
where t.occurred_at is not null and t.member_id is not null
group by t.institution_id, t.member_id, t.group_id, m.full_name, m.member_code, m.phone, g.group_name, date_trunc('day', t.occurred_at)::date;

comment on view public.vw_member_totals_daily is 'Daily transaction totals by member';

grant select on public.vw_member_totals_daily to authenticated;

-- ============================================================================
-- STEP 4: RPC - get_report_summary
-- Returns KPIs and breakdown data for a given scope
-- ============================================================================

create or replace function public.get_report_summary(
  p_scope text,  -- 'institution', 'group', or 'member'
  p_scope_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_status text default null  -- 'all', 'allocated', 'unallocated', 'duplicate', 'flagged'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_user_role text;
  v_effective_institution_id uuid;
  v_from timestamptz;
  v_to timestamptz;
  v_kpis jsonb;
  v_breakdown jsonb;
  v_group_id uuid;
  v_member_id uuid;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution and role
  select institution_id, role into v_user_institution_id, v_user_role
  from public.profiles
  where user_id = v_user_id;
  
  -- Default date range: last 30 days
  v_from := coalesce(p_from, now() - interval '30 days');
  v_to := coalesce(p_to, now());
  
  -- Determine effective institution scope
  if v_user_role = 'PLATFORM_ADMIN' then
    -- Platform admin can scope to any institution
    if p_scope = 'institution' then
      v_effective_institution_id := p_scope_id; -- null means all
    elsif p_scope = 'group' then
      select institution_id into v_effective_institution_id from public.groups where id = p_scope_id;
      v_group_id := p_scope_id;
    elsif p_scope = 'member' then
      select institution_id into v_effective_institution_id from public.members where id = p_scope_id;
      v_member_id := p_scope_id;
    else
      v_effective_institution_id := null;
    end if;
  else
    -- Non-platform admin forced to their institution
    v_effective_institution_id := v_user_institution_id;
    
    if p_scope = 'group' then
      -- Verify group belongs to user's institution
      select id into v_group_id from public.groups 
      where id = p_scope_id and institution_id = v_user_institution_id;
      if v_group_id is null and p_scope_id is not null then
        raise exception 'Access denied: Group not in your institution';
      end if;
    elsif p_scope = 'member' then
      -- Verify member belongs to user's institution
      select id into v_member_id from public.members 
      where id = p_scope_id and institution_id = v_user_institution_id;
      if v_member_id is null and p_scope_id is not null then
        raise exception 'Access denied: Member not in your institution';
      end if;
    end if;
  end if;
  
  -- Build KPIs based on scope
  if p_scope = 'member' and v_member_id is not null then
    -- Member-level KPIs
    select jsonb_build_object(
      'total_contributed', coalesce(sum(amount), 0),
      'transaction_count', count(*),
      'last_payment_date', max(occurred_at),
      'allocated_count', count(*) filter (where allocation_status = 'allocated'),
      'avg_amount', coalesce(avg(amount), 0)
    ) into v_kpis
    from public.transactions
    where member_id = v_member_id
      and occurred_at >= v_from and occurred_at <= v_to
      and (p_status is null or p_status = 'all' or allocation_status = p_status);
    
    v_breakdown := '[]'::jsonb; -- No breakdown for member scope
    
  elsif p_scope = 'group' and v_group_id is not null then
    -- Group-level KPIs
    select jsonb_build_object(
      'total_received', coalesce(sum(amount), 0),
      'allocated_total', coalesce(sum(amount) filter (where allocation_status = 'allocated'), 0),
      'unallocated_count', count(*) filter (where allocation_status = 'unallocated'),
      'member_count', (select count(*) from public.members where group_id = v_group_id and status = 'active'),
      'transaction_count', count(*)
    ) into v_kpis
    from public.transactions
    where group_id = v_group_id
      and occurred_at >= v_from and occurred_at <= v_to
      and (p_status is null or p_status = 'all' or allocation_status = p_status);
    
    -- Breakdown by member
    select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_breakdown
    from (
      select 
        m.id as member_id,
        m.full_name as member_name,
        m.member_code,
        count(t.*) as transaction_count,
        coalesce(sum(t.amount), 0) as total_contributed
      from public.members m
      left join public.transactions t on t.member_id = m.id 
        and t.occurred_at >= v_from and t.occurred_at <= v_to
        and (p_status is null or p_status = 'all' or t.allocation_status = p_status)
      where m.group_id = v_group_id
      group by m.id, m.full_name, m.member_code
      order by total_contributed desc
      limit 50
    ) r;
    
  else
    -- Institution-level KPIs
    select jsonb_build_object(
      'total_received', coalesce(sum(amount), 0),
      'allocated_total', coalesce(sum(amount) filter (where allocation_status = 'allocated'), 0),
      'unallocated_total', coalesce(sum(amount) filter (where allocation_status = 'unallocated'), 0),
      'unallocated_count', count(*) filter (where allocation_status = 'unallocated'),
      'parse_errors_count', (
        select count(*) from public.momo_sms_raw 
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and parse_status = 'error'
          and received_at >= v_from and received_at <= v_to
      ),
      'active_groups_count', (
        select count(*) from public.groups 
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and status = 'active'
      ),
      'active_members_count', (
        select count(*) from public.members 
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and status = 'active'
      )
    ) into v_kpis
    from public.transactions
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and occurred_at >= v_from and occurred_at <= v_to
      and (p_status is null or p_status = 'all' or allocation_status = p_status);
    
    -- Breakdown by group
    select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_breakdown
    from (
      select 
        g.id as group_id,
        g.group_name,
        g.group_code,
        count(t.*) as transaction_count,
        coalesce(sum(t.amount), 0) as total_received,
        coalesce(sum(t.amount) filter (where t.allocation_status = 'allocated'), 0) as allocated_amount,
        count(*) filter (where t.allocation_status = 'unallocated') as unallocated_count
      from public.groups g
      left join public.transactions t on t.group_id = g.id 
        and t.occurred_at >= v_from and t.occurred_at <= v_to
        and (p_status is null or p_status = 'all' or t.allocation_status = p_status)
      where (v_effective_institution_id is null or g.institution_id = v_effective_institution_id)
      group by g.id, g.group_name, g.group_code
      order by total_received desc
      limit 50
    ) r;
  end if;
  
  return jsonb_build_object(
    'scope', p_scope,
    'scope_id', coalesce(v_group_id, v_member_id, v_effective_institution_id),
    'from', v_from,
    'to', v_to,
    'kpis', v_kpis,
    'breakdown', v_breakdown
  );
end;
$$;

comment on function public.get_report_summary is 'Returns KPIs and breakdown data for reports';

grant execute on function public.get_report_summary(text, uuid, timestamptz, timestamptz, text) to authenticated;

-- ============================================================================
-- STEP 5: RPC - get_report_ledger
-- Returns paginated transaction ledger for a given scope
-- ============================================================================

create or replace function public.get_report_ledger(
  p_scope text,  -- 'institution', 'group', or 'member'
  p_scope_id uuid default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_status text default null,  -- 'all', 'allocated', 'unallocated', 'duplicate', 'flagged'
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_institution_id uuid;
  v_user_role text;
  v_effective_institution_id uuid;
  v_from timestamptz;
  v_to timestamptz;
  v_group_id uuid;
  v_member_id uuid;
  v_total_count bigint;
  v_rows jsonb;
begin
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's institution and role
  select institution_id, role into v_user_institution_id, v_user_role
  from public.profiles
  where user_id = v_user_id;
  
  -- Default date range: last 30 days
  v_from := coalesce(p_from, now() - interval '30 days');
  v_to := coalesce(p_to, now());
  
  -- Limit max page size
  p_limit := least(p_limit, 100);
  
  -- Determine effective scope
  if v_user_role = 'PLATFORM_ADMIN' then
    if p_scope = 'institution' then
      v_effective_institution_id := p_scope_id;
    elsif p_scope = 'group' then
      select institution_id into v_effective_institution_id from public.groups where id = p_scope_id;
      v_group_id := p_scope_id;
    elsif p_scope = 'member' then
      select institution_id into v_effective_institution_id from public.members where id = p_scope_id;
      v_member_id := p_scope_id;
    end if;
  else
    v_effective_institution_id := v_user_institution_id;
    
    if p_scope = 'group' then
      select id into v_group_id from public.groups 
      where id = p_scope_id and institution_id = v_user_institution_id;
      if v_group_id is null and p_scope_id is not null then
        raise exception 'Access denied: Group not in your institution';
      end if;
    elsif p_scope = 'member' then
      select id into v_member_id from public.members 
      where id = p_scope_id and institution_id = v_user_institution_id;
      if v_member_id is null and p_scope_id is not null then
        raise exception 'Access denied: Member not in your institution';
      end if;
    end if;
  end if;
  
  -- Get total count
  select count(*) into v_total_count
  from public.vw_transactions_enriched t
  where (v_effective_institution_id is null or t.institution_id = v_effective_institution_id)
    and (v_group_id is null or t.group_id = v_group_id)
    and (v_member_id is null or t.member_id = v_member_id)
    and t.occurred_at >= v_from and t.occurred_at <= v_to
    and (p_status is null or p_status = 'all' or t.allocation_status = p_status);
  
  -- Get paginated rows
  select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) into v_rows
  from (
    select 
      t.id,
      t.occurred_at,
      t.amount,
      t.currency,
      t.type,
      t.channel,
      t.allocation_status,
      t.momo_ref,
      t.momo_tx_id,
      t.payer_phone,
      t.payer_name,
      t.member_id,
      t.member_name,
      t.member_code,
      t.group_id,
      t.group_name,
      t.group_code,
      t.allocated_at,
      t.allocation_note
    from public.vw_transactions_enriched t
    where (v_effective_institution_id is null or t.institution_id = v_effective_institution_id)
      and (v_group_id is null or t.group_id = v_group_id)
      and (v_member_id is null or t.member_id = v_member_id)
      and t.occurred_at >= v_from and t.occurred_at <= v_to
      and (p_status is null or p_status = 'all' or t.allocation_status = p_status)
    order by t.occurred_at desc
    limit p_limit
    offset p_offset
  ) r;
  
  return jsonb_build_object(
    'scope', p_scope,
    'scope_id', coalesce(v_group_id, v_member_id, v_effective_institution_id),
    'from', v_from,
    'to', v_to,
    'total_count', v_total_count,
    'limit', p_limit,
    'offset', p_offset,
    'rows', v_rows
  );
end;
$$;

comment on function public.get_report_ledger is 'Returns paginated transaction ledger for reports';

grant execute on function public.get_report_ledger(text, uuid, timestamptz, timestamptz, text, int, int) to authenticated;

-- ============================================================================
-- End of migration
-- ============================================================================

