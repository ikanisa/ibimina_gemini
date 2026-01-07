-- ============================================================================
-- DASHBOARD MODULE: Indexes + RPC Function
-- Date: 2026-01-07
-- Purpose: Fast, role-adaptive dashboard with single RPC call
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing indexes for fast dashboard queries
-- ============================================================================

-- Transactions indexes for dashboard KPIs
create index if not exists idx_transactions_institution_occurred_at 
  on public.transactions(institution_id, occurred_at desc);

create index if not exists idx_transactions_institution_status_occurred 
  on public.transactions(institution_id, allocation_status, occurred_at desc);

create index if not exists idx_transactions_institution_created 
  on public.transactions(institution_id, created_at desc);

-- MoMo SMS raw indexes for parse errors
create index if not exists idx_momo_sms_raw_institution_parse_status 
  on public.momo_sms_raw(institution_id, parse_status, received_at desc);

-- Audit log indexes for recent activity
create index if not exists idx_audit_log_institution_created 
  on public.audit_log(institution_id, created_at desc);

-- SMS sources index for health checks
create index if not exists idx_sms_sources_institution_last_seen 
  on public.sms_sources(institution_id, last_seen_at desc);

-- ============================================================================
-- STEP 2: Create get_dashboard_summary RPC function
-- ============================================================================

create or replace function public.get_dashboard_summary(
  p_institution_id uuid default null,
  p_days int default 7
)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_user_id uuid;
  v_user_role text;
  v_user_institution_id uuid;
  v_effective_institution_id uuid;
  v_is_platform_admin boolean;
  v_today_start timestamptz;
  v_period_start timestamptz;
  v_result jsonb;
  v_kpis jsonb;
  v_attention jsonb;
  v_unallocated_preview jsonb;
  v_parse_error_preview jsonb;
  v_recent_activity jsonb;
  v_health jsonb;
begin
  -- Get current user info
  v_user_id := auth.uid();
  
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Get user's role and institution
  select role, institution_id 
  into v_user_role, v_user_institution_id
  from public.profiles
  where id = v_user_id;
  
  -- Determine if platform admin
  v_is_platform_admin := v_user_role in ('Super Admin', 'admin', 'PLATFORM_ADMIN');
  
  -- Determine effective institution
  if v_is_platform_admin then
    -- Platform admin can query any institution or all (null)
    v_effective_institution_id := p_institution_id;
  else
    -- Non-admin can only see their own institution
    v_effective_institution_id := v_user_institution_id;
  end if;
  
  -- Calculate time boundaries
  v_today_start := date_trunc('day', now() at time zone 'UTC');
  v_period_start := v_today_start - (p_days || ' days')::interval;
  
  -- ============================================================================
  -- KPIs
  -- ============================================================================
  with kpi_data as (
    select
      -- Today metrics
      coalesce(sum(case when occurred_at >= v_today_start then amount else 0 end), 0) as today_received,
      coalesce(sum(case when occurred_at >= v_today_start and allocation_status = 'allocated' then 1 else 0 end), 0) as today_allocated_count,
      coalesce(sum(case when occurred_at >= v_today_start and allocation_status = 'unallocated' then 1 else 0 end), 0) as today_unallocated_count,
      -- Period metrics (last N days)
      coalesce(sum(case when occurred_at >= v_period_start then amount else 0 end), 0) as period_received,
      coalesce(sum(case when occurred_at >= v_period_start and allocation_status = 'allocated' then 1 else 0 end), 0) as period_allocated_count,
      coalesce(sum(case when occurred_at >= v_period_start and allocation_status = 'unallocated' then 1 else 0 end), 0) as period_unallocated_count,
      -- Aging
      coalesce(sum(case when allocation_status = 'unallocated' and occurred_at < now() - interval '24 hours' then 1 else 0 end), 0) as unallocated_aging_count
    from public.transactions
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and occurred_at >= v_period_start
  ),
  parse_error_count as (
    select count(*) as count
    from public.momo_sms_raw
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and parse_status = 'error'
      and received_at >= v_period_start
  )
  select jsonb_build_object(
    'today', jsonb_build_object(
      'received', kpi_data.today_received,
      'allocated_count', kpi_data.today_allocated_count,
      'unallocated_count', kpi_data.today_unallocated_count
    ),
    'period', jsonb_build_object(
      'days', p_days,
      'received', kpi_data.period_received,
      'allocated_count', kpi_data.period_allocated_count,
      'unallocated_count', kpi_data.period_unallocated_count,
      'parse_errors_count', pec.count,
      'unallocated_aging_count', kpi_data.unallocated_aging_count
    )
  ) into v_kpis
  from kpi_data, parse_error_count pec;
  
  -- ============================================================================
  -- Needs Attention Items
  -- ============================================================================
  with attention_items as (
    -- Unallocated transactions
    select 
      'unallocated' as type,
      'Unallocated Transactions' as title,
      count(*)::int as count,
      case when count(*) > 20 then 'high' when count(*) > 5 then 'medium' else 'low' end as severity,
      '/allocation-queue' as action_path
    from public.transactions
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and allocation_status = 'unallocated'
    
    union all
    
    -- Parse errors
    select 
      'parse_error' as type,
      'Parse Errors' as title,
      count(*)::int as count,
      case when count(*) > 10 then 'high' when count(*) > 3 then 'medium' else 'low' end as severity,
      '/momo-operations' as action_path
    from public.momo_sms_raw
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and parse_status = 'error'
    
    union all
    
    -- SMS sources offline (last seen > 24h)
    select 
      'sms_offline' as type,
      'SMS Sources Offline' as title,
      count(*)::int as count,
      'high' as severity,
      '/settings/sms-sources' as action_path
    from public.sms_sources
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and is_active = true
      and (last_seen_at is null or last_seen_at < now() - interval '24 hours')
    
    union all
    
    -- Missing MoMo code
    select 
      'missing_momo' as type,
      'No Primary MoMo Code' as title,
      1 as count,
      'high' as severity,
      '/settings/institution' as action_path
    where v_effective_institution_id is not null
      and not exists (
        select 1 from public.institution_momo_codes
        where institution_id = v_effective_institution_id
          and is_active = true
          and is_primary = true
      )
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'type', type,
      'title', title,
      'count', count,
      'severity', severity,
      'action_path', action_path
    ) order by 
      case severity when 'high' then 1 when 'medium' then 2 else 3 end,
      count desc
  ) filter (where count > 0), '[]'::jsonb) into v_attention
  from attention_items;
  
  -- ============================================================================
  -- Unallocated Preview (latest 10)
  -- ============================================================================
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'occurred_at', occurred_at,
      'amount', amount,
      'currency', currency,
      'payer_phone', payer_phone,
      'payer_name', payer_name,
      'momo_ref', momo_ref
    ) order by occurred_at desc
  ), '[]'::jsonb) into v_unallocated_preview
  from (
    select id, occurred_at, amount, currency, payer_phone, payer_name, momo_ref
    from public.transactions
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and allocation_status = 'unallocated'
    order by occurred_at desc
    limit 10
  ) unallocated;
  
  -- ============================================================================
  -- Parse Error Preview (latest 10)
  -- ============================================================================
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'received_at', received_at,
      'sender_phone', sender_phone,
      'sms_text', left(sms_text, 100),
      'parse_error', parse_error
    ) order by received_at desc
  ), '[]'::jsonb) into v_parse_error_preview
  from (
    select id, received_at, sender_phone, sms_text, parse_error
    from public.momo_sms_raw
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
      and parse_status = 'error'
    order by received_at desc
    limit 10
  ) errors;
  
  -- ============================================================================
  -- Recent Activity (latest 15)
  -- ============================================================================
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'created_at', created_at,
      'action', action,
      'entity_type', entity_type,
      'actor_email', actor_email,
      'metadata', metadata
    ) order by created_at desc
  ), '[]'::jsonb) into v_recent_activity
  from (
    select id, created_at, action, entity_type, actor_email, metadata
    from public.audit_log
    where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
    order by created_at desc
    limit 15
  ) activity;
  
  -- ============================================================================
  -- Health Indicators
  -- ============================================================================
  with health_data as (
    select
      -- MoMo primary code present
      exists (
        select 1 from public.institution_momo_codes
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and is_active = true
          and is_primary = true
      ) as momo_primary_present,
      -- SMS sources status
      (
        select max(last_seen_at)
        from public.sms_sources
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and is_active = true
      ) as sms_last_seen,
      (
        select count(*)
        from public.sms_sources
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and is_active = true
          and (last_seen_at is null or last_seen_at < now() - interval '24 hours')
      )::int as sms_offline_count,
      (
        select count(*)
        from public.sms_sources
        where (v_effective_institution_id is null or institution_id = v_effective_institution_id)
          and is_active = true
      )::int as sms_total_count
  )
  select jsonb_build_object(
    'momo_primary_code_present', momo_primary_present,
    'sms_sources_last_seen', sms_last_seen,
    'sms_sources_offline_count', sms_offline_count,
    'sms_sources_total_count', sms_total_count,
    'overall_status', case
      when not momo_primary_present then 'warning'
      when sms_offline_count > 0 then 'warning'
      when sms_total_count = 0 then 'warning'
      else 'healthy'
    end
  ) into v_health
  from health_data;
  
  -- ============================================================================
  -- Build final result
  -- ============================================================================
  v_result := jsonb_build_object(
    'institution_id', v_effective_institution_id,
    'is_global', v_effective_institution_id is null,
    'period_days', p_days,
    'generated_at', now(),
    'kpis', v_kpis,
    'attention', v_attention,
    'unallocated_preview', v_unallocated_preview,
    'parse_error_preview', v_parse_error_preview,
    'recent_activity', v_recent_activity,
    'health', v_health
  );
  
  return v_result;
end;
$$;

-- Grant execute permission
grant execute on function public.get_dashboard_summary(uuid, int) to authenticated;

-- Add comment
comment on function public.get_dashboard_summary is 
  'Returns dashboard summary with KPIs, attention items, previews, and health status. 
   Platform admins can query any institution or all (null). Other users see only their institution.';

