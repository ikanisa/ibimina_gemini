-- ============================================================================
-- Seed: SMS Pipeline Demo Data
-- Purpose: Demo data for Phase 8 - SMS Ingestion + Parsing Pipeline
-- ============================================================================

-- ============================================================================
-- STEP 1: Add SMS sources for demo institutions
-- ============================================================================

-- Android gateway for Umwalimu SACCO
insert into public.sms_sources (id, institution_id, name, source_type, device_identifier, is_active, last_seen_at, message_count)
values (
  'd1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'Main Office Phone',
  'android_gateway',
  'android-device-001',
  true,
  now() - interval '30 minutes',
  125
) on conflict (id) do update set
  last_seen_at = excluded.last_seen_at,
  message_count = excluded.message_count;

-- Second device for Umwalimu SACCO (stale - for testing alerts)
insert into public.sms_sources (id, institution_id, name, source_type, device_identifier, is_active, last_seen_at, message_count)
values (
  'd2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Field Agent Phone',
  'android_gateway',
  'android-device-002',
  true,
  now() - interval '36 hours', -- Stale
  45
) on conflict (id) do update set
  last_seen_at = excluded.last_seen_at;

-- Webhook for Kigali MFI
insert into public.sms_sources (id, institution_id, name, source_type, device_identifier, webhook_secret, is_active, last_seen_at)
values (
  'd3333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'MTN Webhook Integration',
  'webhook',
  'webhook-mtn-001',
  'secret_webhook_key_demo_12345',
  true,
  now() - interval '5 minutes'
) on conflict (id) do nothing;

-- ============================================================================
-- STEP 2: Update institution settings for parsing
-- ============================================================================

-- Umwalimu SACCO - deterministic only, high confidence
insert into public.institution_settings (institution_id, parsing_mode, confidence_threshold, dedupe_window_minutes, enable_ai_fallback)
values ('11111111-1111-1111-1111-111111111111', 'deterministic', 0.80, 30, false)
on conflict (institution_id) do update set
  enable_ai_fallback = false,
  confidence_threshold = 0.80;

-- Kigali MFI - AI fallback enabled
insert into public.institution_settings (institution_id, parsing_mode, confidence_threshold, dedupe_window_minutes, enable_ai_fallback)
values ('22222222-2222-2222-2222-222222222222', 'ai_fallback', 0.85, 60, true)
on conflict (institution_id) do update set
  enable_ai_fallback = true,
  confidence_threshold = 0.85;

-- ============================================================================
-- STEP 3: Insert demo raw SMS messages (various patterns)
-- ============================================================================

-- Valid SMS 1: Standard payment received pattern
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's1111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'MTN Mobile Money',
  'You have received 15,000 RWF from UWIMANA MARIE (0788123456). Your new balance is 250,000 RWF. Txn ID: TXN20260107001',
  now() - interval '2 hours',
  public.compute_sms_hash('MTN Mobile Money', 'You have received 15,000 RWF from UWIMANA MARIE (0788123456). Your new balance is 250,000 RWF. Txn ID: TXN20260107001', now() - interval '2 hours'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Valid SMS 2: Payment of X received pattern
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's2222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'MTN MoMo',
  'Payment of 25,000 RWF received. Ref: REF20260107002. Balance: 275,000 RWF',
  now() - interval '1 hour 30 minutes',
  public.compute_sms_hash('MTN MoMo', 'Payment of 25,000 RWF received. Ref: REF20260107002. Balance: 275,000 RWF', now() - interval '1 hour 30 minutes'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Valid SMS 3: NAME has sent you pattern
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's3333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'MoMo',
  'NIYONZIMA JEAN has sent you 5,000 RWF. Your new balance is 280,000 RWF. ID: MOB123456',
  now() - interval '1 hour',
  public.compute_sms_hash('MoMo', 'NIYONZIMA JEAN has sent you 5,000 RWF. Your new balance is 280,000 RWF. ID: MOB123456', now() - interval '1 hour'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Invalid SMS: No amount (parse error expected)
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's4444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'MTN',
  'Your account has been credited. Check your balance for details.',
  now() - interval '45 minutes',
  public.compute_sms_hash('MTN', 'Your account has been credited. Check your balance for details.', now() - interval '45 minutes'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Invalid SMS: Spam/promotional (parse error expected)
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's5555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'PROMO',
  'Congratulations! You have won a free data bundle. Dial *123# to claim.',
  now() - interval '30 minutes',
  public.compute_sms_hash('PROMO', 'Congratulations! You have won a free data bundle. Dial *123# to claim.', now() - interval '30 minutes'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Duplicate SMS (same hash) - should be rejected on ingest
-- Note: This would fail due to unique constraint, demonstrating dedupe

-- SMS for Kigali MFI (different institution)
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's6666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  'd3333333-3333-3333-3333-333333333333',
  'MTN Mobile Money',
  'You have received 50,000 RWF from BUSINESS ACCOUNT (0722999888). Transaction complete. Ref: BIZPAY001',
  now() - interval '20 minutes',
  public.compute_sms_hash('MTN Mobile Money', 'You have received 50,000 RWF from BUSINESS ACCOUNT (0722999888). Transaction complete. Ref: BIZPAY001', now() - interval '20 minutes'),
  'pending',
  'android_gateway'
) on conflict (id) do nothing;

-- Already parsed SMS with transaction
insert into public.momo_sms_raw (
  id, institution_id, sms_source_id, sender_phone, sms_text, received_at, sms_hash, parse_status, source
) values (
  's7777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'd1111111-1111-1111-1111-111111111111',
  'MTN MoMo',
  'You have received 10,000 RWF from HABIMANA PAUL (0788555666). Txn ID: HIST001',
  now() - interval '3 hours',
  public.compute_sms_hash('MTN MoMo', 'You have received 10,000 RWF from HABIMANA PAUL (0788555666). Txn ID: HIST001', now() - interval '3 hours'),
  'success',
  'android_gateway'
) on conflict (id) do nothing;

-- Create the corresponding transaction for s7777777
insert into public.transactions (
  id, institution_id, source_sms_id, type, amount, currency, channel, status,
  occurred_at, payer_phone, payer_name, momo_ref, momo_tx_id, parse_confidence, parse_version, allocation_status
) values (
  't7777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  's7777777-7777-7777-7777-777777777777',
  'Deposit',
  10000.00,
  'RWF',
  'MoMo',
  'COMPLETED',
  now() - interval '3 hours',
  '0788555666',
  'HABIMANA PAUL',
  'HIST001',
  'HIST001',
  0.95,
  'deterministic-v1.0',
  'allocated'
) on conflict (id) do nothing;

-- ============================================================================
-- STEP 4: Add parse attempts for historical SMS
-- ============================================================================

insert into public.sms_parse_attempts (
  sms_id, attempt_no, parser_type, status, confidence, parsed_fields, duration_ms
) values (
  's7777777-7777-7777-7777-777777777777',
  1,
  'deterministic',
  'success',
  0.95,
  jsonb_build_object(
    'amount', 10000,
    'currency', 'RWF',
    'payer_phone', '0788555666',
    'payer_name', 'HABIMANA PAUL',
    'momo_tx_id', 'HIST001'
  ),
  15
) on conflict do nothing;

-- ============================================================================
-- STEP 5: Add audit log entries for SMS processing
-- ============================================================================

insert into public.audit_log (institution_id, action, entity_type, entity_id, metadata)
values (
  '11111111-1111-1111-1111-111111111111',
  'sms_parsed',
  'transaction',
  't7777777-7777-7777-7777-777777777777',
  jsonb_build_object(
    'sms_id', 's7777777-7777-7777-7777-777777777777',
    'parser_type', 'deterministic',
    'confidence', 0.95,
    'amount', 10000
  )
);

insert into public.audit_log (institution_id, action, entity_type, entity_id, metadata)
values (
  '11111111-1111-1111-1111-111111111111',
  'sms_source_seen',
  'sms_source',
  'd1111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'device_identifier', 'android-device-001',
    'message_count', 125
  )
);

-- ============================================================================
-- End of seed
-- ============================================================================

