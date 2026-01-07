-- ============================================================================
-- Seed: Institutions + Staff Demo Data
-- Purpose: Demo data for Phase 7 - Institutions + Staff/User Management
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure we have at least 2 demo institutions with full details
-- ============================================================================

-- Check if our demo institutions already exist; if not, insert them
insert into public.institutions (id, name, type, status, code, supervisor, contact_email, contact_phone, region, total_assets)
values (
  '11111111-1111-1111-1111-111111111111',
  'Umwalimu SACCO Demo',
  'SACCO',
  'ACTIVE',
  'UMS-001',
  'Jean Baptiste Niyonzima',
  'info@umwalimu-demo.rw',
  '+250 788 123 456',
  'Kigali',
  150000000.00
) on conflict (id) do update set
  name = excluded.name,
  supervisor = excluded.supervisor,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  region = excluded.region;

insert into public.institutions (id, name, type, status, code, supervisor, contact_email, contact_phone, region, total_assets)
values (
  '22222222-2222-2222-2222-222222222222',
  'Kigali MFI Demo',
  'MFI',
  'ACTIVE',
  'KMF-001',
  'Marie Claire Uwimana',
  'support@kigali-mfi-demo.rw',
  '+250 788 654 321',
  'Kigali',
  85000000.00
) on conflict (id) do update set
  name = excluded.name,
  supervisor = excluded.supervisor,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  region = excluded.region;

-- Add a suspended institution for testing
insert into public.institutions (id, name, type, status, code, supervisor, contact_email, region, total_assets)
values (
  '33333333-3333-3333-3333-333333333333',
  'Suspended SACCO Example',
  'SACCO',
  'SUSPENDED',
  'SSE-001',
  'Inactive Admin',
  'suspended@example.rw',
  'Eastern Province',
  0.00
) on conflict (id) do nothing;

-- ============================================================================
-- STEP 2: Add MoMo codes for institutions
-- ============================================================================

-- Primary MoMo code for Umwalimu SACCO
insert into public.institution_momo_codes (institution_id, momo_code, is_active, is_primary)
values ('11111111-1111-1111-1111-111111111111', '*182*8*1*12345#', true, true)
on conflict do nothing;

-- Secondary MoMo code for Umwalimu SACCO
insert into public.institution_momo_codes (institution_id, momo_code, is_active, is_primary)
values ('11111111-1111-1111-1111-111111111111', '*182*8*1*12346#', true, false)
on conflict do nothing;

-- Primary MoMo code for Kigali MFI
insert into public.institution_momo_codes (institution_id, momo_code, is_active, is_primary)
values ('22222222-2222-2222-2222-222222222222', '*182*8*1*54321#', true, true)
on conflict do nothing;

-- ============================================================================
-- STEP 3: Add staff invites (pending, accepted, expired examples)
-- ============================================================================

-- Pending invite for Umwalimu SACCO
insert into public.staff_invites (id, email, institution_id, role, status, created_at, expires_at)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'pending.invite@example.com',
  '11111111-1111-1111-1111-111111111111',
  'INSTITUTION_STAFF',
  'pending',
  now() - interval '2 days',
  now() + interval '5 days'
) on conflict (id) do nothing;

-- Expired invite
insert into public.staff_invites (id, email, institution_id, role, status, created_at, expires_at)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'expired.invite@example.com',
  '11111111-1111-1111-1111-111111111111',
  'INSTITUTION_TREASURER',
  'expired',
  now() - interval '10 days',
  now() - interval '3 days'
) on conflict (id) do nothing;

-- Revoked invite
insert into public.staff_invites (id, email, institution_id, role, status, created_at, expires_at)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'revoked.invite@example.com',
  '22222222-2222-2222-2222-222222222222',
  'INSTITUTION_AUDITOR',
  'revoked',
  now() - interval '5 days',
  now() + interval '2 days'
) on conflict (id) do nothing;

-- ============================================================================
-- STEP 4: Add institution settings if not exists
-- ============================================================================

insert into public.institution_settings (institution_id, parsing_mode, confidence_threshold, dedupe_window_minutes, enable_ai_fallback)
values ('11111111-1111-1111-1111-111111111111', 'deterministic', 0.85, 30, true)
on conflict (institution_id) do nothing;

insert into public.institution_settings (institution_id, parsing_mode, confidence_threshold, dedupe_window_minutes, enable_ai_fallback)
values ('22222222-2222-2222-2222-222222222222', 'deterministic', 0.90, 60, false)
on conflict (institution_id) do nothing;

-- ============================================================================
-- STEP 5: Add SMS sources for demo institutions
-- ============================================================================

insert into public.sms_sources (institution_id, source_type, device_identifier, display_name, is_active, last_seen_at)
values ('11111111-1111-1111-1111-111111111111', 'sms_forwarder', 'device-android-001', 'Office Phone 1', true, now() - interval '1 hour')
on conflict do nothing;

insert into public.sms_sources (institution_id, source_type, device_identifier, display_name, is_active, last_seen_at)
values ('11111111-1111-1111-1111-111111111111', 'sms_forwarder', 'device-android-002', 'Field Phone', true, now() - interval '25 hours')
on conflict do nothing;

insert into public.sms_sources (institution_id, source_type, device_identifier, display_name, is_active, last_seen_at)
values ('22222222-2222-2222-2222-222222222222', 'webhook', 'webhook-primary-001', 'Primary Webhook', true, now() - interval '30 minutes')
on conflict do nothing;

-- ============================================================================
-- STEP 6: Add audit log entries for demo actions
-- ============================================================================

-- Log for institution creation
insert into public.audit_log (institution_id, action, entity_type, entity_id, metadata)
values (
  '11111111-1111-1111-1111-111111111111',
  'create_institution',
  'institution',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'name', 'Umwalimu SACCO Demo',
    'type', 'SACCO',
    'created_by', 'seed_script'
  )
);

-- Log for MoMo code setup
insert into public.audit_log (institution_id, action, entity_type, entity_id, metadata)
values (
  '11111111-1111-1111-1111-111111111111',
  'set_primary_momo_code',
  'institution_momo_code',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'momo_code', '*182*8*1*12345#',
    'is_primary', true
  )
);

-- Log for staff invite
insert into public.audit_log (institution_id, action, entity_type, entity_id, metadata)
values (
  '11111111-1111-1111-1111-111111111111',
  'create_staff_invite',
  'staff_invite',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  jsonb_build_object(
    'email', 'pending.invite@example.com',
    'role', 'INSTITUTION_STAFF'
  )
);

-- ============================================================================
-- End of seed
-- ============================================================================

