-- ============================================================================
-- Migration: SMS Ingestion + Parsing Pipeline Module
-- Purpose: Hardened SMS ingestion with dedupe, deterministic parsing, AI fallback
-- ============================================================================

-- ============================================================================
-- STEP 1: Add sms_source_id to momo_sms_raw
-- ============================================================================

-- Add sms_source_id column if not exists
alter table public.momo_sms_raw
  add column if not exists sms_source_id uuid references public.sms_sources(id) on delete set null;

-- Rename 'hash' to 'sms_hash' for clarity (if column exists as 'hash')
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'hash'
  ) and not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'momo_sms_raw' 
    and column_name = 'sms_hash'
  ) then
    alter table public.momo_sms_raw rename column hash to sms_hash;
  end if;
end $$;

-- Add sms_hash if it doesn't exist
alter table public.momo_sms_raw
  add column if not exists sms_hash text;

-- Create unique index on sms_hash
create unique index if not exists idx_momo_sms_raw_sms_hash 
  on public.momo_sms_raw(sms_hash) 
  where sms_hash is not null;

-- Add index for parsing queries
create index if not exists idx_momo_sms_raw_parse_status 
  on public.momo_sms_raw(institution_id, parse_status, received_at desc);

comment on column public.momo_sms_raw.sms_hash is 'SHA256 hash of normalized(sender_phone + sms_text + received_at_bucket) for dedupe';
comment on column public.momo_sms_raw.sms_source_id is 'FK to sms_sources for tracking which device sent this SMS';

-- ============================================================================
-- STEP 2: Add transaction dedupe fields
-- ============================================================================

-- Add momo_tx_id if not exists (unique transaction ID from MoMo)
alter table public.transactions
  add column if not exists momo_tx_id text;

-- Add parse_version for tracking parser updates
alter table public.transactions
  add column if not exists parse_version text default 'v1.0';

-- Add txn_fingerprint for fallback dedupe when momo_tx_id is not available
alter table public.transactions
  add column if not exists txn_fingerprint text;

-- Rename momo_sms_id to source_sms_id if needed
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'transactions' 
    and column_name = 'momo_sms_id'
  ) and not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'transactions' 
    and column_name = 'source_sms_id'
  ) then
    alter table public.transactions rename column momo_sms_id to source_sms_id;
  end if;
end $$;

-- Add source_sms_id if neither exists
alter table public.transactions
  add column if not exists source_sms_id uuid references public.momo_sms_raw(id) on delete set null;

-- Create unique index on momo_tx_id per institution
create unique index if not exists idx_transactions_momo_tx_id_unique 
  on public.transactions(institution_id, momo_tx_id) 
  where momo_tx_id is not null;

-- Create unique index on txn_fingerprint per institution (fallback dedupe)
create unique index if not exists idx_transactions_txn_fingerprint_unique 
  on public.transactions(institution_id, txn_fingerprint) 
  where txn_fingerprint is not null and momo_tx_id is null;

comment on column public.transactions.momo_tx_id is 'Unique transaction ID from MoMo SMS (primary dedupe key)';
comment on column public.transactions.txn_fingerprint is 'SHA256(amount + payer_phone + occurred_at_bucket + momo_ref) for fallback dedupe';
comment on column public.transactions.parse_version is 'Version of parser that created this transaction';

-- ============================================================================
-- STEP 3: Add enable_ai_fallback to institution_settings
-- ============================================================================

alter table public.institution_settings
  add column if not exists enable_ai_fallback boolean not null default false;

comment on column public.institution_settings.enable_ai_fallback is 'Whether to use AI (OpenAI/Gemini) when deterministic parser fails';

-- ============================================================================
-- STEP 4: Create sms_parse_attempts table for observability
-- ============================================================================

create table if not exists public.sms_parse_attempts (
  id uuid primary key default gen_random_uuid(),
  sms_id uuid not null references public.momo_sms_raw(id) on delete cascade,
  attempt_no int not null default 1,
  parser_type text not null check (parser_type in ('deterministic', 'openai', 'gemini')),
  status text not null check (status in ('success', 'error', 'partial')),
  error_message text,
  parsed_fields jsonb,
  confidence numeric(3, 2),
  duration_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_sms_parse_attempts_sms_id 
  on public.sms_parse_attempts(sms_id);

comment on table public.sms_parse_attempts is 'Audit trail for SMS parsing attempts';

-- ============================================================================
-- STEP 5: Add display_name to sms_sources (if missing)
-- ============================================================================

alter table public.sms_sources
  add column if not exists display_name text;

-- ============================================================================
-- STEP 6: Create helper function to compute sms_hash
-- ============================================================================

create or replace function public.compute_sms_hash(
  p_sender_phone text,
  p_sms_text text,
  p_received_at timestamptz
)
returns text
language sql
immutable
as $$
  select encode(
    sha256(
      convert_to(
        -- Normalize: lowercase, trim, bucket time to 1-minute window
        lower(trim(coalesce(p_sender_phone, ''))) || '|' ||
        lower(trim(coalesce(p_sms_text, ''))) || '|' ||
        to_char(date_trunc('minute', coalesce(p_received_at, now())), 'YYYY-MM-DD HH24:MI'),
        'UTF8'
      )
    ),
    'hex'
  );
$$;

comment on function public.compute_sms_hash is 'Computes SHA256 hash for SMS deduplication';

-- ============================================================================
-- STEP 7: Create helper function to compute txn_fingerprint
-- ============================================================================

create or replace function public.compute_txn_fingerprint(
  p_amount numeric,
  p_payer_phone text,
  p_occurred_at timestamptz,
  p_momo_ref text,
  p_dedupe_window_minutes int default 60
)
returns text
language sql
immutable
as $$
  select encode(
    sha256(
      convert_to(
        -- Fingerprint: amount + normalized phone + time bucket + ref
        coalesce(p_amount::text, '0') || '|' ||
        regexp_replace(coalesce(p_payer_phone, ''), '[^0-9]', '', 'g') || '|' ||
        -- Bucket time to dedupe window
        to_char(
          date_trunc('hour', coalesce(p_occurred_at, now())) + 
          (floor(extract(minute from coalesce(p_occurred_at, now())) / p_dedupe_window_minutes) * p_dedupe_window_minutes || ' minutes')::interval,
          'YYYY-MM-DD HH24:MI'
        ) || '|' ||
        lower(trim(coalesce(p_momo_ref, ''))),
        'UTF8'
      )
    ),
    'hex'
  );
$$;

comment on function public.compute_txn_fingerprint is 'Computes SHA256 fingerprint for transaction deduplication when momo_tx_id is missing';

-- ============================================================================
-- STEP 8: Create RPC function for SMS ingestion
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
    -- Extract potential MoMo code pattern from SMS
    v_momo_code := (
      select substring(p_sms_text from '\*182\*[0-9*]+#')
    );
    
    if v_momo_code is not null then
      -- Find institution by momo code
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

comment on function public.ingest_sms is 'Ingest raw SMS with deduplication and institution mapping';

-- ============================================================================
-- STEP 9: Create RPC function for deterministic SMS parsing
-- ============================================================================

create or replace function public.parse_sms_deterministic(
  p_sms_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms public.momo_sms_raw;
  v_settings public.institution_settings;
  v_parsed jsonb;
  v_amount numeric;
  v_currency text;
  v_momo_tx_id text;
  v_momo_ref text;
  v_payer_phone text;
  v_payer_name text;
  v_occurred_at timestamptz;
  v_confidence numeric;
  v_txn_fingerprint text;
  v_transaction_id uuid;
  v_start_time timestamptz;
  v_duration_ms int;
  v_dedupe_window int;
begin
  v_start_time := clock_timestamp();

  -- Get SMS record
  select * into v_sms from public.momo_sms_raw where id = p_sms_id;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'SMS not found');
  end if;

  if v_sms.parse_status = 'success' then
    return jsonb_build_object('success', false, 'error', 'SMS already parsed');
  end if;

  -- Get institution settings
  select * into v_settings
  from public.institution_settings
  where institution_id = v_sms.institution_id;

  v_dedupe_window := coalesce(v_settings.dedupe_window_minutes, 60);

  -- ============================================================================
  -- DETERMINISTIC PARSING RULES
  -- Common MoMo SMS patterns for Rwanda
  -- ============================================================================

  -- Pattern 1: "You have received X RWF from NAME (PHONE)"
  -- Example: "You have received 5000 RWF from JEAN BAPTISTE (0788123456). Txn ID: ABC123"
  if v_sms.sms_text ~* 'you have received\s+([0-9,]+)\s*(rwf|frw)?\s+from\s+([^\(]+)\s*\(([0-9+]+)\)' then
    v_amount := regexp_replace(
      (regexp_match(v_sms.sms_text, 'you have received\s+([0-9,]+)', 'i'))[1],
      ',', '', 'g'
    )::numeric;
    v_currency := 'RWF';
    v_payer_name := trim((regexp_match(v_sms.sms_text, 'from\s+([^\(]+)\s*\(', 'i'))[1]);
    v_payer_phone := (regexp_match(v_sms.sms_text, '\(([0-9+]+)\)', 'i'))[1];
    v_momo_tx_id := (regexp_match(v_sms.sms_text, 'txn\s*id[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_momo_ref := v_momo_tx_id;
    v_occurred_at := v_sms.received_at;
    v_confidence := 0.95;

  -- Pattern 2: "Payment of X RWF received. Ref: ABC123"
  elsif v_sms.sms_text ~* 'payment\s+of\s+([0-9,]+)\s*(rwf|frw)?\s+received' then
    v_amount := regexp_replace(
      (regexp_match(v_sms.sms_text, 'payment\s+of\s+([0-9,]+)', 'i'))[1],
      ',', '', 'g'
    )::numeric;
    v_currency := 'RWF';
    v_momo_ref := (regexp_match(v_sms.sms_text, 'ref[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_momo_tx_id := v_momo_ref;
    v_payer_phone := v_sms.sender_phone;
    v_occurred_at := v_sms.received_at;
    v_confidence := 0.85;

  -- Pattern 3: "NAME has sent you X RWF"
  elsif v_sms.sms_text ~* '([A-Za-z\s]+)\s+has\s+sent\s+you\s+([0-9,]+)\s*(rwf|frw)?' then
    v_payer_name := trim((regexp_match(v_sms.sms_text, '([A-Za-z\s]+)\s+has\s+sent\s+you', 'i'))[1]);
    v_amount := regexp_replace(
      (regexp_match(v_sms.sms_text, 'has\s+sent\s+you\s+([0-9,]+)', 'i'))[1],
      ',', '', 'g'
    )::numeric;
    v_currency := 'RWF';
    v_payer_phone := v_sms.sender_phone;
    v_occurred_at := v_sms.received_at;
    v_momo_ref := (regexp_match(v_sms.sms_text, 'ref[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_momo_tx_id := (regexp_match(v_sms.sms_text, 'id[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_confidence := 0.85;

  -- Pattern 4: Generic amount extraction (lowest confidence)
  elsif v_sms.sms_text ~* '([0-9,]+)\s*(rwf|frw)' then
    v_amount := regexp_replace(
      (regexp_match(v_sms.sms_text, '([0-9,]+)\s*(rwf|frw)', 'i'))[1],
      ',', '', 'g'
    )::numeric;
    v_currency := 'RWF';
    v_payer_phone := v_sms.sender_phone;
    v_occurred_at := v_sms.received_at;
    v_momo_ref := (regexp_match(v_sms.sms_text, 'ref[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_momo_tx_id := (regexp_match(v_sms.sms_text, 'id[:\s]*([A-Za-z0-9]+)', 'i'))[1];
    v_confidence := 0.60;

  else
    -- Cannot parse deterministically
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start_time)::int;
    
    -- Log attempt
    insert into public.sms_parse_attempts (sms_id, attempt_no, parser_type, status, error_message, duration_ms)
    values (p_sms_id, 1, 'deterministic', 'error', 'No matching pattern found', v_duration_ms);

    return jsonb_build_object(
      'success', false,
      'error', 'No matching pattern found',
      'parser_type', 'deterministic',
      'needs_ai_fallback', coalesce(v_settings.enable_ai_fallback, false)
    );
  end if;

  -- Validate parsed amount
  if v_amount is null or v_amount <= 0 then
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start_time)::int;
    
    insert into public.sms_parse_attempts (sms_id, attempt_no, parser_type, status, error_message, duration_ms)
    values (p_sms_id, 1, 'deterministic', 'error', 'Invalid amount', v_duration_ms);

    return jsonb_build_object(
      'success', false,
      'error', 'Invalid amount extracted',
      'parser_type', 'deterministic',
      'needs_ai_fallback', coalesce(v_settings.enable_ai_fallback, false)
    );
  end if;

  -- Check confidence threshold
  if v_confidence < coalesce(v_settings.confidence_threshold, 0.85) then
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start_time)::int;
    
    insert into public.sms_parse_attempts (
      sms_id, attempt_no, parser_type, status, error_message, confidence, parsed_fields, duration_ms
    ) values (
      p_sms_id, 1, 'deterministic', 'partial', 
      'Confidence below threshold', v_confidence,
      jsonb_build_object('amount', v_amount, 'payer_phone', v_payer_phone),
      v_duration_ms
    );

    return jsonb_build_object(
      'success', false,
      'error', 'Confidence below threshold',
      'confidence', v_confidence,
      'threshold', coalesce(v_settings.confidence_threshold, 0.85),
      'parser_type', 'deterministic',
      'needs_ai_fallback', coalesce(v_settings.enable_ai_fallback, false),
      'partial_data', jsonb_build_object(
        'amount', v_amount,
        'payer_phone', v_payer_phone,
        'momo_ref', v_momo_ref
      )
    );
  end if;

  -- Compute transaction fingerprint for dedupe (fallback when momo_tx_id is null)
  v_txn_fingerprint := public.compute_txn_fingerprint(
    v_amount, v_payer_phone, v_occurred_at, v_momo_ref, v_dedupe_window
  );

  -- Create transaction with dedupe constraints
  begin
    insert into public.transactions (
      institution_id,
      source_sms_id,
      type,
      amount,
      currency,
      channel,
      status,
      occurred_at,
      payer_phone,
      payer_name,
      momo_ref,
      momo_tx_id,
      txn_fingerprint,
      parse_confidence,
      parse_version,
      allocation_status
    ) values (
      v_sms.institution_id,
      p_sms_id,
      'Deposit',
      v_amount,
      v_currency,
      'MoMo',
      'COMPLETED',
      v_occurred_at,
      v_payer_phone,
      v_payer_name,
      v_momo_ref,
      v_momo_tx_id,
      case when v_momo_tx_id is null then v_txn_fingerprint else null end,
      v_confidence,
      'deterministic-v1.0',
      'unallocated'
    )
    returning id into v_transaction_id;

  exception when unique_violation then
    -- Duplicate transaction detected
    v_duration_ms := extract(milliseconds from clock_timestamp() - v_start_time)::int;
    
    -- Update SMS status
    update public.momo_sms_raw
    set parse_status = 'success', parse_error = 'Duplicate transaction (ignored)'
    where id = p_sms_id;

    insert into public.sms_parse_attempts (
      sms_id, attempt_no, parser_type, status, error_message, confidence, duration_ms
    ) values (
      p_sms_id, 1, 'deterministic', 'success', 'Duplicate transaction', v_confidence, v_duration_ms
    );

    return jsonb_build_object(
      'success', true,
      'duplicate', true,
      'message', 'Duplicate transaction detected and ignored',
      'parser_type', 'deterministic'
    );
  end;

  -- Update SMS status to success
  update public.momo_sms_raw
  set parse_status = 'success', parse_error = null
  where id = p_sms_id;

  v_duration_ms := extract(milliseconds from clock_timestamp() - v_start_time)::int;

  -- Log successful attempt
  insert into public.sms_parse_attempts (
    sms_id, attempt_no, parser_type, status, confidence, parsed_fields, duration_ms
  ) values (
    p_sms_id, 1, 'deterministic', 'success', v_confidence,
    jsonb_build_object(
      'amount', v_amount,
      'currency', v_currency,
      'payer_phone', v_payer_phone,
      'payer_name', v_payer_name,
      'momo_ref', v_momo_ref,
      'momo_tx_id', v_momo_tx_id
    ),
    v_duration_ms
  );

  return jsonb_build_object(
    'success', true,
    'duplicate', false,
    'transaction_id', v_transaction_id,
    'parser_type', 'deterministic',
    'confidence', v_confidence,
    'parsed_data', jsonb_build_object(
      'amount', v_amount,
      'currency', v_currency,
      'payer_phone', v_payer_phone,
      'payer_name', v_payer_name,
      'momo_ref', v_momo_ref,
      'momo_tx_id', v_momo_tx_id
    )
  );
end;
$$;

comment on function public.parse_sms_deterministic is 'Parse SMS using deterministic regex patterns (no AI)';

-- ============================================================================
-- STEP 10: Create RPC to parse batch of pending SMS
-- ============================================================================

create or replace function public.parse_sms_batch(
  p_limit int default 50,
  p_institution_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms record;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
  v_success_count int := 0;
  v_error_count int := 0;
  v_skip_count int := 0;
begin
  -- Process pending SMS
  for v_sms in
    select id, institution_id
    from public.momo_sms_raw
    where parse_status = 'pending'
      and (p_institution_id is null or institution_id = p_institution_id)
    order by received_at asc
    limit p_limit
  loop
    -- Try deterministic parsing first
    v_result := public.parse_sms_deterministic(v_sms.id);
    
    if (v_result->>'success')::boolean then
      v_success_count := v_success_count + 1;
    else
      -- Mark as error for reconciliation
      update public.momo_sms_raw
      set 
        parse_status = 'error',
        parse_error = v_result->>'error'
      where id = v_sms.id;
      
      v_error_count := v_error_count + 1;
    end if;

    v_results := v_results || jsonb_build_object(
      'sms_id', v_sms.id,
      'result', v_result
    );
  end loop;

  return jsonb_build_object(
    'success', true,
    'processed', v_success_count + v_error_count,
    'success_count', v_success_count,
    'error_count', v_error_count,
    'results', v_results
  );
end;
$$;

comment on function public.parse_sms_batch is 'Parse a batch of pending SMS messages';

-- ============================================================================
-- STEP 11: Create RPC to mark SMS as ignored
-- ============================================================================

create or replace function public.mark_sms_ignored(
  p_sms_id uuid,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sms public.momo_sms_raw;
begin
  select * into v_sms from public.momo_sms_raw where id = p_sms_id;
  
  if not found then
    raise exception 'SMS not found';
  end if;

  -- Permission check
  if not (
    public.is_platform_admin()
    or v_sms.institution_id = public.current_institution_id()
  ) then
    raise exception 'Permission denied';
  end if;

  update public.momo_sms_raw
  set 
    parse_status = 'error',
    parse_error = coalesce(p_reason, 'Manually ignored'),
    resolution_status = 'ignored',
    resolution_note = p_reason,
    resolved_by = auth.uid(),
    resolved_at = now()
  where id = p_sms_id;

  -- Audit log
  insert into public.audit_log (
    actor_user_id, institution_id, action, entity_type, entity_id, metadata
  ) values (
    auth.uid(),
    v_sms.institution_id,
    'mark_sms_ignored',
    'momo_sms_raw',
    p_sms_id,
    jsonb_build_object('reason', p_reason)
  );

  return true;
end;
$$;

comment on function public.mark_sms_ignored is 'Mark an SMS as ignored (not a payment)';

-- ============================================================================
-- STEP 12: Grant permissions
-- ============================================================================

grant execute on function public.compute_sms_hash(text, text, timestamptz) to authenticated;
grant execute on function public.compute_txn_fingerprint(numeric, text, timestamptz, text, int) to authenticated;
grant execute on function public.ingest_sms(text, text, text, timestamptz, int, text) to authenticated;
grant execute on function public.parse_sms_deterministic(uuid) to authenticated;
grant execute on function public.parse_sms_batch(int, uuid) to authenticated;
grant execute on function public.mark_sms_ignored(uuid, text) to authenticated;

-- ============================================================================
-- STEP 13: Enable RLS on sms_parse_attempts
-- ============================================================================

alter table public.sms_parse_attempts enable row level security;

drop policy if exists "sms_parse_attempts_select" on public.sms_parse_attempts;
create policy "sms_parse_attempts_select" on public.sms_parse_attempts
for select using (
  public.is_platform_admin()
  or exists (
    select 1 from public.momo_sms_raw s
    where s.id = sms_parse_attempts.sms_id
    and s.institution_id = public.current_institution_id()
  )
);

-- ============================================================================
-- End of migration
-- ============================================================================

