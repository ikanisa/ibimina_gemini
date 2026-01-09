-- ============================================================================
-- SMS Gateway Devices Module
-- Purpose: Minimal device management for MoMo SMS Gateway
-- Date: 2026-01-10
-- ============================================================================
-- 
-- This migration creates:
-- 1. sms_gateway_devices - Registered phones that forward MoMo payment SMS
-- 2. momo_sms_raw - Raw SMS inbox (immutable evidence)
-- 3. Auto-update trigger for last_sms_received_at
-- 4. RLS policies for authenticated access
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure we have UUID + hashing helpers
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- STEP 2: Devices registered in the portal (active by default)
-- ============================================================================

create table if not exists public.sms_gateway_devices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,

  device_name text not null,
  momo_code text not null, -- <-- key routing identifier (NOT momo number)

  status text not null default 'active'
    check (status in ('active', 'suspended')),

  -- store a hash of a device key (portal shows the plain key once when adding a device)
  device_key_hash text not null,

  -- portal can't know online/offline; only the last time this device sent an SMS
  last_sms_received_at timestamptz null,

  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),

  constraint sms_gateway_devices_unique_momo_code unique (momo_code)
);

create index if not exists sms_gateway_devices_institution_idx
  on public.sms_gateway_devices(institution_id);

create index if not exists sms_gateway_devices_status_idx
  on public.sms_gateway_devices(status);

create index if not exists sms_gateway_devices_momo_code_idx
  on public.sms_gateway_devices(momo_code);

comment on table public.sms_gateway_devices is 'Registered phones that forward MoMo payment SMS using a MoMo Code';

-- ============================================================================
-- STEP 3: Raw SMS inbox (immutable evidence). Parsing happens later.
-- ============================================================================
-- Note: momo_sms_raw may already exist from previous migrations.
-- This migration adds device_id and message_hash columns if they don't exist.

-- Add device_id column if it doesn't exist (nullable initially, will be set when device sends SMS)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'device_id'
  ) then
    alter table public.momo_sms_raw 
    add column device_id uuid references public.sms_gateway_devices(id) on delete restrict;
  end if;
end $$;

-- Add momo_code column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'momo_code'
  ) then
    alter table public.momo_sms_raw 
    add column momo_code text;
  end if;
end $$;

-- Add message_hash column if it doesn't exist (use existing sms_hash or hash if available)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'message_hash'
  ) then
    -- Check if sms_hash exists, if so copy it, otherwise create new
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'sms_hash'
    ) then
      alter table public.momo_sms_raw 
      add column message_hash text;
      update public.momo_sms_raw set message_hash = sms_hash where message_hash is null;
    elsif exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'hash'
    ) then
      alter table public.momo_sms_raw 
      add column message_hash text;
      update public.momo_sms_raw set message_hash = hash where message_hash is null;
    else
      alter table public.momo_sms_raw 
      add column message_hash text;
    end if;
  end if;
end $$;

-- Add ingested_at if it doesn't exist (use created_at or received_at as fallback)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'ingested_at'
  ) then
    alter table public.momo_sms_raw 
    add column ingested_at timestamptz default now();
    -- Populate from created_at or received_at if available
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'created_at'
    ) then
      update public.momo_sms_raw set ingested_at = created_at where ingested_at is null;
    elsif exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'received_at'
    ) then
      update public.momo_sms_raw set ingested_at = received_at where ingested_at is null;
    end if;
  end if;
end $$;

-- Add body column if it doesn't exist (rename from sms_text if available)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'body'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'sms_text'
    ) then
      alter table public.momo_sms_raw 
      add column body text;
      update public.momo_sms_raw set body = sms_text where body is null;
    else
      alter table public.momo_sms_raw 
      add column body text;
    end if;
  end if;
end $$;

-- Add sender column if it doesn't exist (rename from sender_phone if available)
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'sender'
  ) then
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'momo_sms_raw' 
      and column_name = 'sender_phone'
    ) then
      alter table public.momo_sms_raw 
      add column sender text;
      update public.momo_sms_raw set sender = sender_phone where sender is null;
    else
      alter table public.momo_sms_raw 
      add column sender text;
    end if;
  end if;
end $$;

-- Add meta column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'meta'
  ) then
    alter table public.momo_sms_raw 
    add column meta jsonb default '{}'::jsonb;
  end if;
end $$;

-- Create unique index on message_hash if it doesn't exist
-- First drop old indexes if they exist
drop index if exists momo_sms_raw_message_hash_uniq;
create unique index if not exists momo_sms_raw_message_hash_uniq
  on public.momo_sms_raw(message_hash)
  where message_hash is not null;

create index if not exists momo_sms_raw_device_ingested_idx
  on public.momo_sms_raw(device_id, ingested_at desc);

create index if not exists momo_sms_raw_institution_ingested_idx
  on public.momo_sms_raw(institution_id, ingested_at desc);

create index if not exists momo_sms_raw_parse_status_idx
  on public.momo_sms_raw(parse_status);

comment on table public.momo_sms_raw is 'Raw SMS inbox before parsing. Immutable evidence.';

-- ============================================================================
-- STEP 4: Auto-update device.last_sms_received_at when a message comes in
-- ============================================================================

create or replace function public._touch_device_last_sms()
returns trigger
language plpgsql
as $$
begin
  update public.sms_gateway_devices
  set last_sms_received_at = greatest(coalesce(last_sms_received_at, 'epoch'::timestamptz), new.ingested_at)
  where id = new.device_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_device_last_sms on public.momo_sms_raw;

create trigger trg_touch_device_last_sms
after insert on public.momo_sms_raw
for each row execute function public._touch_device_last_sms();

-- ============================================================================
-- STEP 5: Enable RLS
-- ============================================================================

alter table public.sms_gateway_devices enable row level security;
alter table public.momo_sms_raw enable row level security;

-- Minimal read access for signed-in portal users (super admin UI).
-- Writes stay blocked unless done via service role / edge functions.
drop policy if exists "read_devices_authenticated" on public.sms_gateway_devices;
create policy "read_devices_authenticated"
on public.sms_gateway_devices
for select
to authenticated
using (true);

drop policy if exists "read_sms_authenticated" on public.momo_sms_raw;
create policy "read_sms_authenticated"
on public.momo_sms_raw
for select
to authenticated
using (true);

-- Write policies for authenticated users (for UI operations)
-- TODO: In production, consider moving writes to Edge Functions for better security
drop policy if exists "write_devices_authenticated" on public.sms_gateway_devices;
create policy "write_devices_authenticated"
on public.sms_gateway_devices
for all
to authenticated
using (true)
with check (true);

-- ============================================================================
-- STEP 6: Helper function to generate device key (for edge function use)
-- ============================================================================

create or replace function public.generate_device_key()
returns text
language plpgsql
as $$
declare
  v_key text;
begin
  -- Generate a random 32-character hex string
  v_key := encode(gen_random_bytes(16), 'hex');
  return v_key;
end;
$$;

comment on function public.generate_device_key is 'Generates a secure device key for SMS gateway devices';
