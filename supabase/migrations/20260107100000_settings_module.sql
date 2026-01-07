-- ============================================================================
-- SETTINGS MODULE: Schema + RLS + RPC Functions
-- Date: 2026-01-07
-- Purpose: Minimalist settings management with audit trails
-- ============================================================================

-- ============================================================================
-- STEP 1: Create institution_settings table
-- ============================================================================

create table if not exists public.institution_settings (
  institution_id uuid primary key references public.institutions(id) on delete cascade,
  
  -- Parsing configuration
  parsing_mode text not null default 'deterministic' check (parsing_mode in ('deterministic', 'ai_fallback')),
  confidence_threshold numeric(3, 2) not null default 0.85 check (confidence_threshold >= 0.5 and confidence_threshold <= 1.0),
  dedupe_window_minutes int not null default 60 check (dedupe_window_minutes >= 5 and dedupe_window_minutes <= 1440),
  
  -- Notification settings
  low_confidence_alert_enabled boolean not null default true,
  unallocated_alert_threshold int not null default 10,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.institution_settings is 'Institution-specific settings for parsing and notifications';
comment on column public.institution_settings.parsing_mode is 'deterministic = rules only, ai_fallback = use AI when rules fail';
comment on column public.institution_settings.confidence_threshold is 'Minimum confidence (0.5-1.0) for auto-allocation';
comment on column public.institution_settings.dedupe_window_minutes is 'Minutes to check for duplicate SMS (5-1440)';

-- ============================================================================
-- STEP 2: Create sms_sources table
-- ============================================================================

create table if not exists public.sms_sources (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  
  -- Source identification
  name text not null,
  source_type text not null default 'android_gateway' check (source_type in ('android_gateway', 'webhook', 'manual')),
  device_identifier text, -- unique device ID for Android gateway
  webhook_secret text, -- for webhook sources
  
  -- Status
  is_active boolean not null default true,
  last_seen_at timestamptz,
  message_count int not null default 0,
  
  -- Metadata
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Unique device per institution
  unique(institution_id, device_identifier)
);

create index if not exists idx_sms_sources_institution_id on public.sms_sources(institution_id);
create index if not exists idx_sms_sources_active on public.sms_sources(is_active) where is_active = true;

comment on table public.sms_sources is 'SMS source devices/webhooks per institution';

-- ============================================================================
-- STEP 3: Add is_primary to institution_momo_codes
-- ============================================================================

alter table public.institution_momo_codes 
  add column if not exists is_primary boolean not null default false;

-- Ensure only one primary code per institution
create unique index if not exists idx_institution_momo_codes_primary 
  on public.institution_momo_codes(institution_id) 
  where is_primary = true;

-- ============================================================================
-- STEP 4: Enable RLS for new tables
-- ============================================================================

alter table public.institution_settings enable row level security;
alter table public.sms_sources enable row level security;

-- institution_settings policies
drop policy if exists "institution_settings_select" on public.institution_settings;
create policy "institution_settings_select"
on public.institution_settings for select
using (
  public.is_platform_admin() 
  or institution_id = public.current_institution_id()
);

drop policy if exists "institution_settings_insert" on public.institution_settings;
create policy "institution_settings_insert"
on public.institution_settings for insert
with check (
  public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    )
  )
);

drop policy if exists "institution_settings_update" on public.institution_settings;
create policy "institution_settings_update"
on public.institution_settings for update
using (
  public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    )
  )
);

-- sms_sources policies
drop policy if exists "sms_sources_select" on public.sms_sources;
create policy "sms_sources_select"
on public.sms_sources for select
using (
  public.is_platform_admin()
  or institution_id = public.current_institution_id()
);

drop policy if exists "sms_sources_insert" on public.sms_sources;
create policy "sms_sources_insert"
on public.sms_sources for insert
with check (
  public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    )
  )
);

drop policy if exists "sms_sources_update" on public.sms_sources;
create policy "sms_sources_update"
on public.sms_sources for update
using (
  public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    )
  )
);

drop policy if exists "sms_sources_delete" on public.sms_sources;
create policy "sms_sources_delete"
on public.sms_sources for delete
using (
  public.is_platform_admin()
  or (
    institution_id = public.current_institution_id()
    and exists (
      select 1 from public.profiles p
      where p.user_id = auth.uid()
      and p.role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
    )
  )
);

-- ============================================================================
-- STEP 5: RPC Functions with Audit Logging
-- ============================================================================

-- Function: Set primary MoMo code for institution
create or replace function public.set_primary_momo_code(
  p_institution_id uuid,
  p_momo_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
  v_old_primary_code text;
begin
  -- Permission check
  if not (
    public.is_platform_admin()
    or (
      p_institution_id = public.current_institution_id()
      and exists (
        select 1 from public.profiles
        where user_id = auth.uid()
        and role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
      )
    )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Validate MoMo code format (basic validation)
  if p_momo_code is null or length(trim(p_momo_code)) < 3 then
    raise exception 'Invalid MoMo code';
  end if;

  -- Get current primary code for audit
  select momo_code into v_old_primary_code
  from public.institution_momo_codes
  where institution_id = p_institution_id and is_primary = true;

  -- Remove existing primary flag
  update public.institution_momo_codes
  set is_primary = false
  where institution_id = p_institution_id and is_primary = true;

  -- Insert or update the new primary code
  insert into public.institution_momo_codes (institution_id, momo_code, is_active, is_primary)
  values (p_institution_id, trim(p_momo_code), true, true)
  on conflict (institution_id, momo_code) do update
  set is_active = true, is_primary = true
  returning id into v_code_id;

  -- Audit log
  insert into public.audit_log (actor_user_id, institution_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    p_institution_id,
    'set_primary_momo_code',
    'institution_momo_codes',
    v_code_id,
    jsonb_build_object(
      'old_code', v_old_primary_code,
      'new_code', p_momo_code
    )
  );

  return v_code_id;
end;
$$;

-- Function: Update institution settings
create or replace function public.update_institution_settings(
  p_institution_id uuid,
  p_parsing_mode text default null,
  p_confidence_threshold numeric default null,
  p_dedupe_window_minutes int default null,
  p_low_confidence_alert_enabled boolean default null,
  p_unallocated_alert_threshold int default null
)
returns public.institution_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.institution_settings;
  v_old_settings jsonb;
  v_new_settings jsonb;
begin
  -- Permission check
  if not (
    public.is_platform_admin()
    or (
      p_institution_id = public.current_institution_id()
      and exists (
        select 1 from public.profiles
        where user_id = auth.uid()
        and role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
      )
    )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Validate inputs
  if p_parsing_mode is not null and p_parsing_mode not in ('deterministic', 'ai_fallback') then
    raise exception 'Invalid parsing_mode. Must be deterministic or ai_fallback';
  end if;

  if p_confidence_threshold is not null and (p_confidence_threshold < 0.5 or p_confidence_threshold > 1.0) then
    raise exception 'confidence_threshold must be between 0.5 and 1.0';
  end if;

  if p_dedupe_window_minutes is not null and (p_dedupe_window_minutes < 5 or p_dedupe_window_minutes > 1440) then
    raise exception 'dedupe_window_minutes must be between 5 and 1440';
  end if;

  -- Get old settings for audit
  select to_jsonb(s.*) into v_old_settings
  from public.institution_settings s
  where s.institution_id = p_institution_id;

  -- Upsert settings
  insert into public.institution_settings (institution_id)
  values (p_institution_id)
  on conflict (institution_id) do nothing;

  update public.institution_settings
  set
    parsing_mode = coalesce(p_parsing_mode, parsing_mode),
    confidence_threshold = coalesce(p_confidence_threshold, confidence_threshold),
    dedupe_window_minutes = coalesce(p_dedupe_window_minutes, dedupe_window_minutes),
    low_confidence_alert_enabled = coalesce(p_low_confidence_alert_enabled, low_confidence_alert_enabled),
    unallocated_alert_threshold = coalesce(p_unallocated_alert_threshold, unallocated_alert_threshold),
    updated_at = now()
  where institution_id = p_institution_id
  returning * into v_result;

  -- Get new settings for audit
  v_new_settings := to_jsonb(v_result);

  -- Audit log
  insert into public.audit_log (actor_user_id, institution_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    p_institution_id,
    'update_institution_settings',
    'institution_settings',
    p_institution_id,
    jsonb_build_object('old', v_old_settings, 'new', v_new_settings)
  );

  return v_result;
end;
$$;

-- Function: Register SMS source
create or replace function public.register_sms_source(
  p_institution_id uuid,
  p_name text,
  p_source_type text default 'android_gateway',
  p_device_identifier text default null
)
returns public.sms_sources
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.sms_sources;
  v_webhook_secret text;
begin
  -- Permission check
  if not (
    public.is_platform_admin()
    or (
      p_institution_id = public.current_institution_id()
      and exists (
        select 1 from public.profiles
        where user_id = auth.uid()
        and role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
      )
    )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Validate
  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'Name must be at least 2 characters';
  end if;

  if p_source_type not in ('android_gateway', 'webhook', 'manual') then
    raise exception 'Invalid source_type';
  end if;

  -- Generate webhook secret for webhook type
  if p_source_type = 'webhook' then
    v_webhook_secret := encode(gen_random_bytes(32), 'hex');
  end if;

  insert into public.sms_sources (
    institution_id, name, source_type, device_identifier, webhook_secret
  ) values (
    p_institution_id, trim(p_name), p_source_type, p_device_identifier, v_webhook_secret
  )
  returning * into v_result;

  -- Audit log
  insert into public.audit_log (actor_user_id, institution_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    p_institution_id,
    'register_sms_source',
    'sms_sources',
    v_result.id,
    jsonb_build_object('name', p_name, 'source_type', p_source_type)
  );

  return v_result;
end;
$$;

-- Function: Deactivate SMS source
create or replace function public.deactivate_sms_source(
  p_source_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.sms_sources;
begin
  -- Get source
  select * into v_source
  from public.sms_sources
  where id = p_source_id;

  if not found then
    raise exception 'SMS source not found';
  end if;

  -- Permission check
  if not (
    public.is_platform_admin()
    or (
      v_source.institution_id = public.current_institution_id()
      and exists (
        select 1 from public.profiles
        where user_id = auth.uid()
        and role in ('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
      )
    )
  ) then
    raise exception 'Permission denied';
  end if;

  -- Deactivate
  update public.sms_sources
  set is_active = false, updated_at = now()
  where id = p_source_id;

  -- Audit log
  insert into public.audit_log (actor_user_id, institution_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_source.institution_id,
    'deactivate_sms_source',
    'sms_sources',
    p_source_id,
    jsonb_build_object('name', v_source.name)
  );

  return true;
end;
$$;

-- Function: Get settings health status
create or replace function public.get_settings_health(p_institution_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_has_primary_momo boolean;
  v_has_active_sms_source boolean;
  v_sms_source_stale boolean;
  v_unallocated_count int;
  v_issues jsonb := '[]'::jsonb;
begin
  -- Check primary MoMo code
  select exists(
    select 1 from public.institution_momo_codes
    where institution_id = p_institution_id and is_primary = true and is_active = true
  ) into v_has_primary_momo;

  if not v_has_primary_momo then
    v_issues := v_issues || jsonb_build_object(
      'type', 'warning',
      'message', 'No primary MoMo code configured',
      'action', 'Set a primary MoMo code in Institution settings'
    );
  end if;

  -- Check SMS sources
  select exists(
    select 1 from public.sms_sources
    where institution_id = p_institution_id and is_active = true
  ) into v_has_active_sms_source;

  if not v_has_active_sms_source then
    v_issues := v_issues || jsonb_build_object(
      'type', 'warning',
      'message', 'No active SMS source',
      'action', 'Register an SMS source to receive MoMo messages'
    );
  end if;

  -- Check stale SMS source (>24h since last seen)
  select exists(
    select 1 from public.sms_sources
    where institution_id = p_institution_id 
      and is_active = true
      and last_seen_at < now() - interval '24 hours'
  ) into v_sms_source_stale;

  if v_sms_source_stale then
    v_issues := v_issues || jsonb_build_object(
      'type', 'warning',
      'message', 'SMS source has not been seen in 24+ hours',
      'action', 'Check your SMS gateway connection'
    );
  end if;

  -- Count unallocated transactions
  select count(*) into v_unallocated_count
  from public.transactions
  where institution_id = p_institution_id
    and allocation_status = 'unallocated';

  if v_unallocated_count > 10 then
    v_issues := v_issues || jsonb_build_object(
      'type', 'alert',
      'message', format('%s unallocated transactions need attention', v_unallocated_count),
      'action', 'Review the Allocation Queue'
    );
  end if;

  v_result := jsonb_build_object(
    'healthy', jsonb_array_length(v_issues) = 0,
    'issues', v_issues,
    'stats', jsonb_build_object(
      'has_primary_momo', v_has_primary_momo,
      'has_active_sms_source', v_has_active_sms_source,
      'unallocated_count', v_unallocated_count
    )
  );

  return v_result;
end;
$$;

-- ============================================================================
-- STEP 6: Grant execute permissions
-- ============================================================================

grant execute on function public.set_primary_momo_code(uuid, text) to authenticated;
grant execute on function public.update_institution_settings(uuid, text, numeric, int, boolean, int) to authenticated;
grant execute on function public.register_sms_source(uuid, text, text, text) to authenticated;
grant execute on function public.deactivate_sms_source(uuid) to authenticated;
grant execute on function public.get_settings_health(uuid) to authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

