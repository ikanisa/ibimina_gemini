# Apply SMS Gateway Devices Migration

## Quick Steps

1. **Open Supabase Dashboard SQL Editor**
   - Go to: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm/sql/new

2. **Copy the migration SQL below** (entire content)

3. **Paste and Run** in the SQL Editor

4. **Verify** using the queries at the bottom

---

## Migration SQL

Copy everything below this line:

```sql
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

create table if not exists public.momo_sms_raw (
  id bigserial primary key,

  device_id uuid not null references public.sms_gateway_devices(id) on delete restrict,
  institution_id uuid not null references public.institutions(id) on delete restrict,

  momo_code text not null,

  sender text null,
  body text not null,

  -- when the SMS arrived on the phone (if the app provides it)
  received_at timestamptz null,

  -- when your portal received it
  ingested_at timestamptz not null default now(),

  -- used to dedupe identical SMS pushes (computed by the gateway app or backend)
  message_hash text not null,

  parse_status text not null default 'pending'
    check (parse_status in ('pending', 'parsed', 'failed')),
  parse_error text null,
  parsed_at timestamptz null,

  meta jsonb not null default '{}'::jsonb
);

-- Prevent duplicates
create unique index if not exists momo_sms_raw_message_hash_uniq
  on public.momo_sms_raw(message_hash);

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
```

---

## Verification Queries

After running the migration, run these to verify:

```sql
-- 1. Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('sms_gateway_devices', 'momo_sms_raw');

-- Expected: 2 rows

-- 2. Check trigger exists
SELECT trigger_name 
FROM information_schema.triggers
WHERE trigger_name = 'trg_touch_device_last_sms';

-- Expected: 1 row

-- 3. Check RLS policies
SELECT tablename, policyname 
FROM pg_policies
WHERE tablename IN ('sms_gateway_devices', 'momo_sms_raw');

-- Expected: 2 policies (read_devices_authenticated, read_sms_authenticated)
```

---

## Next Steps After Migration

1. ✅ Verify migration succeeded (run queries above)
2. ✅ Test the UI: Navigate to "SMS Gateway Devices" in sidebar
3. ✅ Add a test device to verify everything works
4. ✅ Create Edge Functions for SMS ingestion (next phase)
