-- ============================================================================
-- Phase 9: Security, Audit, and Performance Polish
-- Date: 2026-01-07
-- Purpose: Production-grade permissions, audit trails, and indexes
-- ============================================================================

-- ============================================================================
-- STEP 1: Define standardized action taxonomy
-- ============================================================================

-- Create audit action enum for consistency
do $$
begin
  if not exists (select 1 from pg_type where typname = 'audit_action_type') then
    create type audit_action_type as enum (
      -- SMS Pipeline
      'SMS_INGESTED',
      'SMS_PARSED',
      'SMS_PARSE_FAILED',
      'SMS_IGNORED',
      'SMS_RETRY',
      
      -- Transactions
      'TX_CREATED',
      'TX_ALLOCATED',
      'TX_MARKED_DUPLICATE',
      'TX_FLAGGED',
      'TX_REVERSED',
      
      -- Members/Groups
      'MEMBER_CREATED',
      'MEMBER_UPDATED',
      'MEMBER_IMPORTED',
      'GROUP_CREATED',
      'GROUP_UPDATED',
      'GROUP_IMPORTED',
      
      -- Settings
      'SETTINGS_UPDATED',
      'MOMO_CODE_SET',
      'SMS_SOURCE_REGISTERED',
      'SMS_SOURCE_DEACTIVATED',
      
      -- Institutions
      'INSTITUTION_CREATED',
      'INSTITUTION_UPDATED',
      'INSTITUTION_SUSPENDED',
      
      -- Staff
      'STAFF_INVITED',
      'STAFF_INVITE_REVOKED',
      'STAFF_ROLE_UPDATED',
      'STAFF_DEACTIVATED',
      'STAFF_REACTIVATED',
      'STAFF_TRANSFERRED',
      
      -- Auth (future use)
      'USER_LOGIN',
      'USER_LOGOUT',
      'PASSWORD_CHANGED',
      
      -- Generic fallback
      'CUSTOM'
    );
  end if;
end $$;

-- Add action_type column to audit_log (optional, action text still works)
alter table public.audit_log
  add column if not exists actor_email text;

-- ============================================================================
-- STEP 2: Fix momo_sms_raw RLS (remove NULL institution_id access)
-- ============================================================================

drop policy if exists "momo_sms_raw_access" on public.momo_sms_raw;

-- Only platform admin or same institution can access
-- Remove the "OR institution_id IS NULL" which was a security hole
create policy "momo_sms_raw_select" on public.momo_sms_raw
for select using (
  public.is_platform_admin()
  or institution_id = public.current_institution_id()
);

create policy "momo_sms_raw_insert" on public.momo_sms_raw
for insert with check (
  public.is_platform_admin()
  or institution_id = public.current_institution_id()
  or institution_id is null -- Allow NULL only on insert (will be set by RPC)
);

create policy "momo_sms_raw_update" on public.momo_sms_raw
for update using (
  public.is_platform_admin()
  or institution_id = public.current_institution_id()
);

-- ============================================================================
-- STEP 3: Create role-based permission helpers
-- ============================================================================

-- Check if user can write (non-auditor check)
create or replace function public.can_write()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role not in ('INSTITUTION_AUDITOR') 
     from public.profiles 
     where user_id = auth.uid()),
    false
  );
$$;

-- Check if user can manage institution (admin roles only)
create or replace function public.can_manage_institution(p_institution_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select 
      role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
      and (p_institution_id is null or p_institution_id = institution_id or role = 'PLATFORM_ADMIN')
     from public.profiles 
     where user_id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- STEP 4: Add INSTITUTION_AUDITOR read-only enforcement
-- ============================================================================

-- Transactions: auditors can only SELECT
drop policy if exists "transactions_access" on public.transactions;

create policy "transactions_select" on public.transactions
for select using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

create policy "transactions_insert" on public.transactions
for insert with check (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

create policy "transactions_update" on public.transactions
for update using (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

-- Members: auditors can only SELECT
drop policy if exists "members_access" on public.members;

create policy "members_select" on public.members
for select using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

create policy "members_insert" on public.members
for insert with check (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

create policy "members_update" on public.members
for update using (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

-- Groups: auditors can only SELECT
drop policy if exists "groups_access" on public.groups;

create policy "groups_select" on public.groups
for select using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

create policy "groups_insert" on public.groups
for insert with check (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

create policy "groups_update" on public.groups
for update using (
  public.can_write()
  and (public.is_platform_admin() or institution_id = public.current_institution_id())
);

-- ============================================================================
-- STEP 5: Add missing composite indexes for performance
-- ============================================================================

-- Dashboard queries
create index if not exists idx_transactions_inst_occurred
  on public.transactions(institution_id, occurred_at desc);

create index if not exists idx_transactions_inst_status_occurred
  on public.transactions(institution_id, allocation_status, occurred_at desc);

create index if not exists idx_transactions_inst_allocation_status
  on public.transactions(institution_id, allocation_status)
  where allocation_status = 'unallocated';

-- Audit log queries
create index if not exists idx_audit_log_inst_created
  on public.audit_log(institution_id, created_at desc);

create index if not exists idx_audit_log_action_created
  on public.audit_log(action, created_at desc);

create index if not exists idx_audit_log_entity
  on public.audit_log(entity_type, entity_id);

-- Member phone lookups (conditional based on column existence)
do $$
begin
  -- Try phone_primary first
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'members' 
    and column_name = 'phone_primary'
  ) then
    execute 'create index if not exists idx_members_inst_phone_primary 
      on public.members(institution_id, phone_primary) 
      where phone_primary is not null';
  end if;
  
  -- Try phone column as fallback
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'members' 
    and column_name = 'phone'
  ) then
    execute 'create index if not exists idx_members_inst_phone 
      on public.members(institution_id, phone) 
      where phone is not null';
  end if;
end $$;

-- SMS sources last seen
create index if not exists idx_sms_sources_inst_last_seen
  on public.sms_sources(institution_id, last_seen_at desc);

-- Staff invites
create index if not exists idx_staff_invites_inst_status
  on public.staff_invites(institution_id, status);

-- ============================================================================
-- STEP 6: Update ingest_sms to log SMS_INGESTED event
-- ============================================================================

create or replace function public.ingest_sms(
  p_device_identifier text,
  p_sender_phone text,
  p_sms_text text,
  p_received_at timestamptz,
  p_sim_slot int default null,
  p_message_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms_source public.sms_sources;
  v_institution_id uuid;
  v_sms_hash text;
  v_sms_id uuid;
  v_momo_code text;
  v_existing_sms_id uuid;
begin
  -- Step 1: Find SMS source by device_identifier
  select * into v_sms_source
  from public.sms_sources
  where device_identifier = p_device_identifier
    and is_active = true
  limit 1;

  if not found then
    -- Try to find by looking for momo code in SMS and matching institution
    v_momo_code := (
      select substring(p_sms_text from '\*182\*[0-9*]+#')
    );
    
    if v_momo_code is not null then
      select institution_id into v_institution_id
      from public.institution_momo_codes
      where momo_code = v_momo_code and is_active = true
      limit 1;
    end if;
    
    if v_institution_id is null then
      return jsonb_build_object(
        'success', false,
        'error', 'Unknown device and cannot determine institution from SMS',
        'device_identifier', p_device_identifier
      );
    end if;
  else
    v_institution_id := v_sms_source.institution_id;
  end if;

  -- Step 2: Compute SMS hash for deduplication
  v_sms_hash := public.compute_sms_hash(p_sender_phone, p_sms_text, p_received_at);

  -- Step 3: Check for existing SMS (idempotency)
  select id into v_existing_sms_id
  from public.momo_sms_raw
  where sms_hash = v_sms_hash;

  if v_existing_sms_id is not null then
    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'sms_id', v_existing_sms_id,
      'message', 'SMS already ingested'
    );
  end if;

  -- Step 4: Insert new SMS record
  insert into public.momo_sms_raw (
    institution_id,
    sms_source_id,
    sender_phone,
    sms_text,
    received_at,
    sms_hash,
    parse_status,
    source
  ) values (
    v_institution_id,
    v_sms_source.id,
    p_sender_phone,
    p_sms_text,
    p_received_at,
    v_sms_hash,
    'pending',
    case when v_sms_source.id is not null then 'android_gateway'::sms_source else 'manual_import'::sms_source end
  )
  returning id into v_sms_id;

  -- Step 5: Update sms_source last_seen_at and message_count
  if v_sms_source.id is not null then
    update public.sms_sources
    set 
      last_seen_at = now(),
      message_count = message_count + 1,
      updated_at = now()
    where id = v_sms_source.id;
  end if;

  -- Step 6: Log SMS_INGESTED audit event (NEW)
  insert into public.audit_log (
    actor_user_id,
    institution_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), -- System user if no auth
    v_institution_id,
    'SMS_INGESTED',
    'momo_sms_raw',
    v_sms_id,
    jsonb_build_object(
      'sender_phone', p_sender_phone,
      'sms_source_id', v_sms_source.id,
      'device_identifier', p_device_identifier
    )
  );

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'sms_id', v_sms_id,
    'institution_id', v_institution_id,
    'sms_source_id', v_sms_source.id,
    'message', 'SMS ingested successfully'
  );
end;
$$;

-- ============================================================================
-- STEP 7: Create paginated audit log RPC
-- ============================================================================

create or replace function public.get_audit_log_paginated(
  p_institution_id uuid default null,
  p_limit int default 50,
  p_cursor timestamptz default null,
  p_action_filter text default null,
  p_entity_type_filter text default null,
  p_actor_filter text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_institution_id uuid;
  v_results jsonb;
  v_has_more boolean;
  v_next_cursor timestamptz;
  v_total_count int;
begin
  -- Determine institution scope
  if public.is_platform_admin() then
    v_institution_id := p_institution_id; -- Can filter or see all
  else
    v_institution_id := public.current_institution_id();
    if v_institution_id is null then
      return jsonb_build_object('success', false, 'error', 'No institution access');
    end if;
  end if;

  -- Build query with filters
  with filtered_logs as (
    select 
      al.id,
      al.actor_user_id,
      al.actor_email,
      coalesce(al.actor_email, p.email) as resolved_actor_email,
      p.full_name as actor_name,
      al.institution_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.metadata,
      al.created_at
    from public.audit_log al
    left join public.profiles p on al.actor_user_id = p.user_id
    where 
      (v_institution_id is null or al.institution_id = v_institution_id)
      and (p_cursor is null or al.created_at < p_cursor)
      and (p_action_filter is null or al.action ilike '%' || p_action_filter || '%')
      and (p_entity_type_filter is null or al.entity_type = p_entity_type_filter)
      and (p_actor_filter is null or coalesce(al.actor_email, p.email, '') ilike '%' || p_actor_filter || '%')
      and (p_date_from is null or al.created_at >= p_date_from)
      and (p_date_to is null or al.created_at <= p_date_to)
    order by al.created_at desc
    limit p_limit + 1
  )
  select 
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'actor_user_id', actor_user_id,
        'actor_email', resolved_actor_email,
        'actor_name', actor_name,
        'institution_id', institution_id,
        'action', action,
        'entity_type', entity_type,
        'entity_id', entity_id,
        'metadata', metadata,
        'created_at', created_at
      ) order by created_at desc
    ),
    count(*) > p_limit,
    min(created_at)
  into v_results, v_has_more, v_next_cursor
  from (
    select * from filtered_logs limit p_limit
  ) limited;

  return jsonb_build_object(
    'success', true,
    'items', coalesce(v_results, '[]'::jsonb),
    'has_more', v_has_more,
    'next_cursor', case when v_has_more then v_next_cursor else null end
  );
end;
$$;

grant execute on function public.get_audit_log_paginated(uuid, int, timestamptz, text, text, text, timestamptz, timestamptz) to authenticated;

-- ============================================================================
-- STEP 8: Create system health check RPC
-- ============================================================================

create or replace function public.get_system_health(p_institution_id uuid default null)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_institution_id uuid;
  v_issues jsonb := '[]'::jsonb;
  v_status text := 'healthy';
  v_has_primary_momo boolean;
  v_has_active_sms_source boolean;
  v_sms_source_stale boolean;
  v_unallocated_count int;
  v_unallocated_aging_count int;
  v_parse_errors_count int;
  v_last_sms_seen timestamptz;
begin
  -- Determine institution scope
  if public.is_platform_admin() and p_institution_id is not null then
    v_institution_id := p_institution_id;
  else
    v_institution_id := public.current_institution_id();
  end if;

  if v_institution_id is null then
    return jsonb_build_object(
      'status', 'unknown',
      'issues', '[]'::jsonb,
      'message', 'No institution context'
    );
  end if;

  -- Check: Primary MoMo code
  select exists(
    select 1 from public.institution_momo_codes
    where institution_id = v_institution_id and is_primary = true and is_active = true
  ) into v_has_primary_momo;

  if not v_has_primary_momo then
    v_status := 'warning';
    v_issues := v_issues || jsonb_build_object(
      'type', 'MOMO_CODE_MISSING',
      'severity', 'warning',
      'message', 'No primary MoMo code configured',
      'action', 'Go to Settings → Institution to set up'
    );
  end if;

  -- Check: Active SMS source
  select exists(
    select 1 from public.sms_sources
    where institution_id = v_institution_id and is_active = true
  ) into v_has_active_sms_source;

  if not v_has_active_sms_source then
    v_status := 'warning';
    v_issues := v_issues || jsonb_build_object(
      'type', 'SMS_SOURCE_MISSING',
      'severity', 'warning',
      'message', 'No active SMS source',
      'action', 'Register an Android gateway or webhook'
    );
  end if;

  -- Check: SMS source stale (>24h)
  select 
    max(last_seen_at),
    exists(
      select 1 from public.sms_sources
      where institution_id = v_institution_id 
        and is_active = true
        and (last_seen_at is null or last_seen_at < now() - interval '24 hours')
    )
  into v_last_sms_seen, v_sms_source_stale
  from public.sms_sources
  where institution_id = v_institution_id and is_active = true;

  if v_sms_source_stale and v_has_active_sms_source then
    v_status := 'error';
    v_issues := v_issues || jsonb_build_object(
      'type', 'SMS_SOURCE_OFFLINE',
      'severity', 'error',
      'message', 'SMS source offline for 24+ hours',
      'action', 'Check your gateway device connection',
      'last_seen', v_last_sms_seen
    );
  end if;

  -- Check: Unallocated transactions
  select count(*) into v_unallocated_count
  from public.transactions
  where institution_id = v_institution_id
    and allocation_status = 'unallocated';

  if v_unallocated_count > 10 then
    v_issues := v_issues || jsonb_build_object(
      'type', 'UNALLOCATED_QUEUE',
      'severity', 'info',
      'message', v_unallocated_count || ' unallocated transactions',
      'action', 'Review the Allocation Queue',
      'count', v_unallocated_count
    );
  end if;

  -- Check: Unallocated aging >24h
  select count(*) into v_unallocated_aging_count
  from public.transactions
  where institution_id = v_institution_id
    and allocation_status = 'unallocated'
    and occurred_at < now() - interval '24 hours';

  if v_unallocated_aging_count > 0 then
    v_status := case when v_status = 'healthy' then 'warning' else v_status end;
    v_issues := v_issues || jsonb_build_object(
      'type', 'UNALLOCATED_AGING',
      'severity', 'warning',
      'message', v_unallocated_aging_count || ' transactions aging >24 hours',
      'action', 'Urgent: Allocate these transactions',
      'count', v_unallocated_aging_count
    );
  end if;

  -- Check: Parse errors
  select count(*) into v_parse_errors_count
  from public.momo_sms_raw
  where institution_id = v_institution_id
    and parse_status = 'error'
    and (resolution_status is null or resolution_status = 'open');

  if v_parse_errors_count > 5 then
    v_issues := v_issues || jsonb_build_object(
      'type', 'PARSE_ERRORS',
      'severity', 'warning',
      'message', v_parse_errors_count || ' SMS parse errors need review',
      'action', 'Go to Reconciliation → Parse Errors',
      'count', v_parse_errors_count
    );
  end if;

  return jsonb_build_object(
    'status', v_status,
    'issues', v_issues,
    'checks', jsonb_build_object(
      'has_primary_momo', v_has_primary_momo,
      'has_active_sms_source', v_has_active_sms_source,
      'sms_source_stale', v_sms_source_stale,
      'last_sms_seen', v_last_sms_seen,
      'unallocated_count', v_unallocated_count,
      'unallocated_aging_count', v_unallocated_aging_count,
      'parse_errors_count', v_parse_errors_count
    ),
    'checked_at', now()
  );
end;
$$;

grant execute on function public.get_system_health(uuid) to authenticated;

-- ============================================================================
-- STEP 9: Grant permissions for helper functions
-- ============================================================================

grant execute on function public.can_write() to authenticated;
grant execute on function public.can_manage_institution(uuid) to authenticated;

-- ============================================================================
-- End of Phase 9 Security Polish Migration
-- ============================================================================

