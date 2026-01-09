-- ============================================================================
-- CONSOLIDATE SMS DEVICE TABLES
-- Purpose: Merge sms_sources into sms_gateway_devices (single source of truth)
-- Date: 2026-01-10
-- ============================================================================
-- 
-- This migration:
-- 1. Adds missing columns from sms_sources to sms_gateway_devices
-- 2. Migrates data from sms_sources to sms_gateway_devices
-- 3. Updates momo_sms_raw to use only device_id
-- 4. Drops sms_sources table
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to sms_gateway_devices
-- ============================================================================

-- Add source_type column (android_gateway, webhook, manual)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'source_type'
  ) then
    alter table public.sms_gateway_devices 
    add column source_type text not null default 'android_gateway'
      check (source_type in ('android_gateway', 'webhook', 'manual'));
  end if;
end $$;

-- Add device_identifier column (for Android devices)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'device_identifier'
  ) then
    alter table public.sms_gateway_devices 
    add column device_identifier text;
  end if;
end $$;

-- Add webhook_secret column (for webhook sources)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'webhook_secret'
  ) then
    alter table public.sms_gateway_devices 
    add column webhook_secret text;
  end if;
end $$;

-- Add is_active column (alias for status, for compatibility)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'is_active'
  ) then
    alter table public.sms_gateway_devices 
    add column is_active boolean not null default true;
    -- Sync with status
    update public.sms_gateway_devices set is_active = (status = 'active');
  end if;
end $$;

-- Add last_seen_at column (alias for last_sms_received_at, for compatibility)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'last_seen_at'
  ) then
    alter table public.sms_gateway_devices 
    add column last_seen_at timestamptz null;
    -- Sync with last_sms_received_at
    update public.sms_gateway_devices set last_seen_at = last_sms_received_at;
  end if;
end $$;

-- Add message_count column
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'message_count'
  ) then
    alter table public.sms_gateway_devices 
    add column message_count int not null default 0;
  end if;
end $$;

-- Add updated_at column
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'sms_gateway_devices' 
    and column_name = 'updated_at'
  ) then
    alter table public.sms_gateway_devices 
    add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Add unique constraint on device_identifier per institution
create unique index if not exists sms_gateway_devices_unique_device_identifier
  on public.sms_gateway_devices(institution_id, device_identifier)
  where device_identifier is not null;

-- ============================================================================
-- STEP 2: Migrate data from sms_sources to sms_gateway_devices
-- ============================================================================

-- Only migrate if sms_sources table exists and has data
do $$
declare
  v_sources_count int;
  v_migrated_count int;
begin
  -- Check if sms_sources exists
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'sms_sources'
  ) then
    -- Count records
    select count(*) into v_sources_count from public.sms_sources;
    
    if v_sources_count > 0 then
      -- Migrate data
      insert into public.sms_gateway_devices (
        id,
        institution_id,
        device_name,
        momo_code, -- Generate from device_identifier or use a placeholder
        source_type,
        device_identifier,
        webhook_secret,
        device_key_hash, -- Generate a placeholder hash
        status,
        is_active,
        last_seen_at,
        last_sms_received_at,
        message_count,
        created_at,
        updated_at
      )
      select 
        ss.id,
        ss.institution_id,
        ss.name as device_name,
        -- Generate momo_code: use device_identifier or create from id
        coalesce(
          (select momo_code from public.institution_momo_codes 
           where institution_id = ss.institution_id and is_primary = true limit 1),
          'DEV-' || substring(ss.id::text, 1, 8)
        ) as momo_code,
        ss.source_type,
        ss.device_identifier,
        ss.webhook_secret,
        -- Generate placeholder hash (will be updated when device authenticates)
        encode(gen_random_bytes(16), 'hex') as device_key_hash,
        case when ss.is_active then 'active' else 'suspended' end as status,
        ss.is_active,
        ss.last_seen_at,
        ss.last_seen_at as last_sms_received_at,
        ss.message_count,
        ss.created_at,
        ss.updated_at
      from public.sms_sources ss
      on conflict (id) do update set
        source_type = excluded.source_type,
        device_identifier = excluded.device_identifier,
        webhook_secret = excluded.webhook_secret,
        is_active = excluded.is_active,
        last_seen_at = excluded.last_seen_at,
        message_count = excluded.message_count,
        updated_at = excluded.updated_at;
      
      get diagnostics v_migrated_count = row_count;
      raise notice 'Migrated % records from sms_sources to sms_gateway_devices', v_migrated_count;
    else
      raise notice 'sms_sources table exists but is empty, skipping migration';
    end if;
  else
    raise notice 'sms_sources table does not exist, skipping migration';
  end if;
end $$;

-- ============================================================================
-- STEP 3: Update momo_sms_raw to use device_id instead of sms_source_id
-- ============================================================================

-- Migrate sms_source_id references to device_id
do $$
begin
  -- If sms_source_id exists and device_id doesn't have the data, copy it
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'sms_source_id'
  ) and exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'device_id'
  ) then
    -- Update device_id from sms_source_id where device_id is null
    update public.momo_sms_raw
    set device_id = sms_source_id
    where sms_source_id is not null 
      and device_id is null
      and exists (
        select 1 from public.sms_gateway_devices 
        where id = momo_sms_raw.sms_source_id
      );
    
    raise notice 'Migrated sms_source_id references to device_id';
  end if;
end $$;

-- ============================================================================
-- STEP 4: Create trigger to sync status and is_active
-- ============================================================================

create or replace function public._sync_device_status()
returns trigger
language plpgsql
as $$
begin
  -- Sync is_active with status
  if TG_OP = 'UPDATE' then
    if NEW.status = 'active' and OLD.status != 'active' then
      NEW.is_active := true;
    elsif NEW.status = 'suspended' and OLD.status != 'suspended' then
      NEW.is_active := false;
    end if;
    
    -- Sync last_seen_at with last_sms_received_at
    if NEW.last_sms_received_at is not null then
      NEW.last_seen_at := NEW.last_sms_received_at;
    end if;
    
    NEW.updated_at := now();
  end if;
  
  return NEW;
end;
$$;

drop trigger if exists trg_sync_device_status on public.sms_gateway_devices;
create trigger trg_sync_device_status
before insert or update on public.sms_gateway_devices
for each row execute function public._sync_device_status();

-- ============================================================================
-- STEP 5: Update trigger to also update last_seen_at
-- ============================================================================

-- Update the existing trigger to also set last_seen_at
create or replace function public._touch_device_last_sms()
returns trigger
language plpgsql
as $$
begin
  update public.sms_gateway_devices
  set 
    last_sms_received_at = greatest(coalesce(last_sms_received_at, 'epoch'::timestamptz), new.ingested_at),
    last_seen_at = greatest(coalesce(last_seen_at, 'epoch'::timestamptz), new.ingested_at),
    message_count = message_count + 1,
    updated_at = now()
  where id = new.device_id;

  return new;
end;
$$;

-- ============================================================================
-- STEP 6: Drop sms_sources table (after migration)
-- ============================================================================

-- Drop foreign key constraint from momo_sms_raw first
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints 
    where constraint_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and constraint_name like '%sms_source%'
  ) then
    -- Find and drop the constraint
    execute (
      select 'alter table public.momo_sms_raw drop constraint ' || constraint_name
      from information_schema.table_constraints 
      where constraint_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and constraint_name like '%sms_source%'
      limit 1
    );
  end if;
end $$;

-- Drop sms_sources table (CASCADE will drop dependent objects)
drop table if exists public.sms_sources CASCADE;

-- ============================================================================
-- STEP 7: Clean up sms_source_id column from momo_sms_raw (optional)
-- ============================================================================

-- Note: We keep the column for now to avoid breaking existing code
-- It can be dropped in a future migration after all code is updated
-- Uncomment below to drop immediately:
-- alter table public.momo_sms_raw drop column if exists sms_source_id;

-- ============================================================================
-- STEP 8: Update RLS policies (if needed)
-- ============================================================================

-- RLS policies should already exist from sms_gateway_devices migration
-- Verify they're correct

-- ============================================================================
-- STEP 9: Summary
-- ============================================================================

do $$
begin
  raise notice '=== SMS DEVICE TABLE CONSOLIDATION COMPLETE ===';
  raise notice 'Merged sms_sources into sms_gateway_devices';
  raise notice 'Updated momo_sms_raw to use device_id';
  raise notice 'Dropped sms_sources table';
  raise notice '';
  raise notice 'Next steps:';
  raise notice '1. Update SmsSourcesSettings.tsx to use sms_gateway_devices';
  raise notice '2. Update SMS ingestion functions to use sms_gateway_devices';
  raise notice '3. Update dashboard queries to use sms_gateway_devices';
  raise notice '4. (Optional) Drop sms_source_id column from momo_sms_raw';
end $$;
