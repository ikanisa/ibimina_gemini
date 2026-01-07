-- ============================================================================
-- Settings Module Seed Data
-- ============================================================================
-- This seed file populates settings-related tables with demo data for testing
-- the Settings module functionality.
-- 
-- Note: Run this after the 20260107100000_settings_module.sql migration
-- ============================================================================

-- Ensure we have demo institutions
INSERT INTO public.institutions (id, name, status, email, phone, type)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kigali Savings & Credit', 'Active', 'admin@kigalisacco.rw', '+250 788 000 001', 'SACCO'),
  ('22222222-2222-2222-2222-222222222222', 'Rwanda MicroFinance Corp', 'Active', 'contact@rwandamf.rw', '+250 788 000 002', 'SACCO')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone;

-- Institution MoMo Codes
INSERT INTO public.institution_momo_codes (id, institution_id, momo_code, is_primary, is_active)
VALUES
  -- Kigali Savings - Primary code
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '*182*8*1*123456#', true, true),
  -- Kigali Savings - Secondary code
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '*182*8*1*654321#', false, true),
  -- Rwanda MicroFinance - Primary code
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '*182*8*1*789012#', true, true)
ON CONFLICT (id) DO UPDATE SET
  momo_code = EXCLUDED.momo_code,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active;

-- Institution Settings (using correct column names from migration)
INSERT INTO public.institution_settings (institution_id, parsing_mode, confidence_threshold, dedupe_window_minutes)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'ai_fallback', 0.85, 60),
  ('22222222-2222-2222-2222-222222222222', 'deterministic', 0.90, 30)
ON CONFLICT (institution_id) DO UPDATE SET
  parsing_mode = EXCLUDED.parsing_mode,
  confidence_threshold = EXCLUDED.confidence_threshold,
  dedupe_window_minutes = EXCLUDED.dedupe_window_minutes;

-- SMS Sources
INSERT INTO public.sms_sources (id, institution_id, name, source_type, device_identifier, is_active, webhook_secret)
VALUES
  -- Kigali Savings - Active Android gateway
  ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Office Phone Samsung A52', 'android_gateway', 'device-samsung-a52-001', true, NULL),
  -- Kigali Savings - Webhook
  ('dddd2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Primary Webhook', 'webhook', NULL, true, 'whsec_demo_123456789abcdef'),
  -- Rwanda MicroFinance - Android gateway
  ('eeee1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Branch 1 Phone', 'android_gateway', 'device-xiaomi-redmi-003', true, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  device_identifier = EXCLUDED.device_identifier,
  is_active = EXCLUDED.is_active,
  webhook_secret = EXCLUDED.webhook_secret;

-- Demo Staff Profiles
INSERT INTO public.profiles (id, email, full_name, phone, role, institution_id, is_active)
VALUES
  -- Platform Admin
  ('eeee0001-0001-0001-0001-000000000001', 'admin@ibimina.rw', 'Jean-Pierre Admin', '+250 788 111 001', 'Super Admin', NULL, true),
  -- Kigali Savings staff
  ('eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'Marie Uwimana', '+250 788 111 002', 'Branch Manager', '11111111-1111-1111-1111-111111111111', true),
  ('eeee0003-0003-0003-0003-000000000003', 'staff1@kigalisacco.rw', 'Emmanuel Habimana', '+250 788 111 003', 'Staff', '11111111-1111-1111-1111-111111111111', true),
  -- Rwanda MicroFinance staff
  ('eeee0005-0005-0005-0005-000000000005', 'manager@rwandamf.rw', 'Patrick Niyonzima', '+250 788 111 005', 'Branch Manager', '22222222-2222-2222-2222-222222222222', true)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  institution_id = EXCLUDED.institution_id,
  is_active = EXCLUDED.is_active;

-- Sample Audit Log Entries
INSERT INTO public.audit_log (id, institution_id, actor_user_id, actor_email, action, entity_type, entity_id, metadata, created_at)
VALUES
  -- Recent settings changes for Kigali Savings
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'update_parsing_settings', 'settings', '11111111-1111-1111-1111-111111111111', '{"old_threshold": 0.80, "new_threshold": 0.85}'::jsonb, NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'add_momo_code', 'momo_code', 'aaaa2222-2222-2222-2222-222222222222', '{"momo_code": "*182*8*1*654321#"}'::jsonb, NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0001-0001-0001-0001-000000000001', 'admin@ibimina.rw', 'register_sms_source', 'sms_source', 'dddd1111-1111-1111-1111-111111111111', '{"name": "Office Phone Samsung A52", "type": "android_gateway"}'::jsonb, NOW() - INTERVAL '3 days'),
  -- Staff login events
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0003-0003-0003-0003-000000000003', 'staff1@kigalisacco.rw', 'login', 'profile', 'eeee0003-0003-0003-0003-000000000003', NULL, NOW() - INTERVAL '30 minutes'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'login', 'profile', 'eeee0002-0002-0002-0002-000000000002', NULL, NOW() - INTERVAL '1 hour'),
  -- Rwanda MicroFinance audit events
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'eeee0005-0005-0005-0005-000000000005', 'manager@rwandamf.rw', 'update_institution_profile', 'institution', '22222222-2222-2222-2222-222222222222', '{"old_name": "Rwanda MF", "new_name": "Rwanda MicroFinance Corp"}'::jsonb, NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- This seed creates:
-- - 2 Institutions with contact details
-- - 3 MoMo codes (2 for institution 1, 1 for institution 2)
-- - 2 Institution settings records with different configurations
-- - 3 SMS sources (2 for institution 1, 1 for institution 2)
-- - 4 Staff profiles across both institutions
-- - 6 Sample audit log entries showing various actions
-- ============================================================================
