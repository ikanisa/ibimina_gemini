-- ============================================================================
-- DASHBOARD MODULE: Fix RPC Function
-- Date: 2026-01-07
-- Purpose: Fix profile lookup and match spec exactly
-- ============================================================================

-- Drop and recreate with correct implementation
drop function if exists public.get_dashboard_summary(uuid, int);

create or replace function public.get_dashboard_summary(
  p_institution_id uuid default null,
  p_days int default 7
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_role text;
  v_user_institution uuid;
  v_scope_institution uuid;
  v_today_start timestamptz := date_trunc('day', now());
  v_today_end   timestamptz := date_trunc('day', now()) + interval '1 day';
  v_from        timestamptz := now() - make_interval(days => p_days);
  v_momo_present boolean;
  v_offline_sources int;
  v_last_sms_seen timestamptz;
begin
  -- Get role and institution from profiles (user_id is the primary key)
  select role::text, institution_id
    into v_role, v_user_institution
  from profiles
  where user_id = auth.uid();

  -- Scope rules: PLATFORM_ADMIN can view all or specific institution
  if v_role = 'PLATFORM_ADMIN' then
    v_scope_institution := p_institution_id; -- null means ALL
  else
    v_scope_institution := v_user_institution; -- forced to their own institution
  end if;

  -- Health check: Primary MoMo code present
  select exists(
    select 1 from institution_momo_codes
    where is_active = true and is_primary = true
      and (v_scope_institution is null or institution_id = v_scope_institution)
  ) into v_momo_present;

  -- Health check: SMS sources offline (6 hours threshold per spec)
  select count(*)::int
  into v_offline_sources
  from sms_sources
  where is_active = true
    and (v_scope_institution is null or institution_id = v_scope_institution)
    and (last_seen_at is null or last_seen_at < now() - interval '6 hours');

  -- Health check: Last SMS seen
  select max(received_at)
  into v_last_sms_seen
  from momo_sms_raw
  where (v_scope_institution is null or institution_id = v_scope_institution);

  return jsonb_build_object(
    'institution_id', v_scope_institution,
    'is_global', v_scope_institution is null,
    'period_days', p_days,
    'generated_at', now(),
    
    -- KPIs
    'kpis', jsonb_build_object(
      'today', jsonb_build_object(
        'received_total', coalesce((
          select sum(amount) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and occurred_at >= v_today_start and occurred_at < v_today_end
        ), 0),
        'allocated_count', coalesce((
          select count(*) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and allocation_status = 'allocated'
            and occurred_at >= v_today_start and occurred_at < v_today_end
        ), 0),
        'unallocated_count', coalesce((
          select count(*) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and allocation_status = 'unallocated'
            and occurred_at >= v_today_start and occurred_at < v_today_end
        ), 0),
        'parse_errors_count', coalesce((
          select count(*) from momo_sms_raw
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and parse_status = 'error'
            and received_at >= v_today_start and received_at < v_today_end
        ), 0)
      ),
      'last_days', jsonb_build_object(
        'days', p_days,
        'received_total', coalesce((
          select sum(amount) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and occurred_at >= v_from
        ), 0),
        'allocated_count', coalesce((
          select count(*) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and allocation_status = 'allocated'
            and occurred_at >= v_from
        ), 0),
        'unallocated_count', coalesce((
          select count(*) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and allocation_status = 'unallocated'
            and occurred_at >= v_from
        ), 0),
        'unallocated_aging_24h', coalesce((
          select count(*) from transactions
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and allocation_status = 'unallocated'
            and occurred_at < now() - interval '24 hours'
        ), 0),
        'parse_errors_count', coalesce((
          select count(*) from momo_sms_raw
          where (v_scope_institution is null or institution_id = v_scope_institution)
            and parse_status = 'error'
            and received_at >= v_from
        ), 0)
      )
    ),
    
    -- Attention items (filtered to only include items with count > 0)
    'attention', (
      select coalesce(jsonb_agg(item order by 
        case (item->>'severity') when 'high' then 1 when 'medium' then 2 else 3 end,
        (item->>'count')::int desc
      ), '[]'::jsonb) from (
        select jsonb_build_object(
          'type', 'UNALLOCATED',
          'title', 'Unallocated transactions',
          'count', (select count(*) from transactions
                    where (v_scope_institution is null or institution_id = v_scope_institution)
                      and allocation_status = 'unallocated'),
          'severity', case 
            when (select count(*) from transactions
                  where (v_scope_institution is null or institution_id = v_scope_institution)
                    and allocation_status = 'unallocated') > 10 then 'high' 
            when (select count(*) from transactions
                  where (v_scope_institution is null or institution_id = v_scope_institution)
                    and allocation_status = 'unallocated') > 0 then 'medium'
            else 'low' end,
          'action_path', '/reconciliation'
        ) as item
        where (select count(*) from transactions
               where (v_scope_institution is null or institution_id = v_scope_institution)
                 and allocation_status = 'unallocated') > 0
        
        union all
        
        select jsonb_build_object(
          'type', 'UNALLOCATED_AGING_24H',
          'title', 'Unallocated > 24 hours',
          'count', (select count(*) from transactions
                    where (v_scope_institution is null or institution_id = v_scope_institution)
                      and allocation_status = 'unallocated'
                      and occurred_at < now() - interval '24 hours'),
          'severity', 'high',
          'action_path', '/reconciliation?aging=24h'
        )
        where (select count(*) from transactions
               where (v_scope_institution is null or institution_id = v_scope_institution)
                 and allocation_status = 'unallocated'
                 and occurred_at < now() - interval '24 hours') > 0
        
        union all
        
        select jsonb_build_object(
          'type', 'PARSE_ERRORS',
          'title', 'SMS parse errors',
          'count', (select count(*) from momo_sms_raw
                    where (v_scope_institution is null or institution_id = v_scope_institution)
                      and parse_status = 'error'),
          'severity', 'medium',
          'action_path', '/reconciliation?tab=parse-errors'
        )
        where (select count(*) from momo_sms_raw
               where (v_scope_institution is null or institution_id = v_scope_institution)
                 and parse_status = 'error') > 0
        
        union all
        
        select jsonb_build_object(
          'type', 'SMS_SOURCE_OFFLINE',
          'title', 'SMS source offline',
          'count', v_offline_sources,
          'severity', 'high',
          'action_path', '/settings/sms-sources'
        )
        where v_offline_sources > 0
        
        union all
        
        select jsonb_build_object(
          'type', 'MOMO_CODE_MISSING',
          'title', 'Primary MoMo code missing',
          'count', 1,
          'severity', 'high',
          'action_path', '/settings/institution'
        )
        where not v_momo_present and v_scope_institution is not null
      ) s
    ),
    
    -- Unallocated preview (latest 10)
    'unallocated_preview', coalesce((
      select jsonb_agg(row_to_json(t)) from (
        select id, occurred_at, amount, payer_phone, momo_ref
        from transactions
        where (v_scope_institution is null or institution_id = v_scope_institution)
          and allocation_status = 'unallocated'
        order by occurred_at desc
        limit 10
      ) t
    ), '[]'::jsonb),
    
    -- Parse error preview (latest 10)
    'parse_error_preview', coalesce((
      select jsonb_agg(row_to_json(s)) from (
        select id, received_at, sender_phone, parse_error
        from momo_sms_raw
        where (v_scope_institution is null or institution_id = v_scope_institution)
          and parse_status = 'error'
        order by received_at desc
        limit 10
      ) s
    ), '[]'::jsonb),
    
    -- Recent activity (latest 15)
    'recent_activity', coalesce((
      select jsonb_agg(row_to_json(a)) from (
        select id, created_at, action, actor_user_id, actor_email, metadata
        from audit_log
        where (v_scope_institution is null or institution_id = v_scope_institution)
        order by created_at desc
        limit 15
      ) a
    ), '[]'::jsonb),
    
    -- Health indicators
    'health', jsonb_build_object(
      'momo_primary_code_present', v_momo_present,
      'sms_sources_offline_count', v_offline_sources,
      'last_sms_seen_at', v_last_sms_seen
    )
  );
end $$;

-- Grant execute permission
grant execute on function public.get_dashboard_summary(uuid, int) to authenticated;

-- Add comment
comment on function public.get_dashboard_summary is 
  'Returns dashboard summary. PLATFORM_ADMIN can view all (null) or specific institution. Others see only their own institution.';

