-- ============================================================================
-- Dashboard Demo Data
-- ============================================================================
-- This seed file populates data needed for the dashboard to display:
-- - Transactions (allocated and unallocated)
-- - MoMo SMS raw (with parse errors)
-- - Audit log entries
-- ============================================================================

-- Use existing institution IDs from settings seed
-- Institution 1: 11111111-1111-1111-1111-111111111111 (Kigali Savings & Credit)
-- Institution 2: 22222222-2222-2222-2222-222222222222 (Rwanda MicroFinance Corp)

-- ============================================================================
-- Create some groups and members if they don't exist
-- ============================================================================

INSERT INTO public.groups (id, institution_id, name, code, status, created_at)
VALUES
  ('gggg0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Umuganda Savings Group', 'USG001', 'ACTIVE', NOW() - INTERVAL '30 days'),
  ('gggg0002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'Women Entrepreneurs', 'WEN001', 'ACTIVE', NOW() - INTERVAL '25 days'),
  ('gggg0003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'Farmers Cooperative', 'FAR001', 'ACTIVE', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.members (id, institution_id, group_id, full_name, phone, member_code, status, created_at)
VALUES
  ('mmmm0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'gggg0001-0001-0001-0001-000000000001', 'Jean Damascene', '+250788100001', 'MBR001', 'ACTIVE', NOW() - INTERVAL '28 days'),
  ('mmmm0002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'gggg0001-0001-0001-0001-000000000001', 'Marie Claire', '+250788100002', 'MBR002', 'ACTIVE', NOW() - INTERVAL '27 days'),
  ('mmmm0003-0003-0003-0003-000000000003', '11111111-1111-1111-1111-111111111111', 'gggg0002-0002-0002-0002-000000000002', 'Emmanuel Niyonzima', '+250788100003', 'MBR003', 'ACTIVE', NOW() - INTERVAL '26 days'),
  ('mmmm0004-0004-0004-0004-000000000004', '22222222-2222-2222-2222-222222222222', 'gggg0003-0003-0003-0003-000000000003', 'Patricie Uwimana', '+250788100004', 'MBR004', 'ACTIVE', NOW() - INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Create allocated transactions (last 7 days)
-- ============================================================================

INSERT INTO public.transactions (id, institution_id, member_id, group_id, type, amount, currency, channel, status, reference, occurred_at, payer_phone, payer_name, momo_ref, parse_confidence, allocation_status, created_at)
VALUES
  -- Today - allocated
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0001-0001-0001-0001-000000000001', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 50000, 'RWF', 'MOMO', 'COMPLETED', 'TXN001', NOW() - INTERVAL '2 hours', '+250788100001', 'Jean Damascene', 'MP240107.1234.A00001', 0.95, 'allocated', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0002-0002-0002-0002-000000000002', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 25000, 'RWF', 'MOMO', 'COMPLETED', 'TXN002', NOW() - INTERVAL '3 hours', '+250788100002', 'Marie Claire', 'MP240107.1234.A00002', 0.92, 'allocated', NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0003-0003-0003-0003-000000000003', 'gggg0002-0002-0002-0002-000000000002', 'DEPOSIT', 100000, 'RWF', 'MOMO', 'COMPLETED', 'TXN003', NOW() - INTERVAL '4 hours', '+250788100003', 'Emmanuel Niyonzima', 'MP240107.1234.A00003', 0.88, 'allocated', NOW() - INTERVAL '4 hours'),
  
  -- Yesterday - allocated
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0001-0001-0001-0001-000000000001', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 75000, 'RWF', 'MOMO', 'COMPLETED', 'TXN004', NOW() - INTERVAL '1 day', '+250788100001', 'Jean Damascene', 'MP240106.1234.A00001', 0.97, 'allocated', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0002-0002-0002-0002-000000000002', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 30000, 'RWF', 'MOMO', 'COMPLETED', 'TXN005', NOW() - INTERVAL '1 day 2 hours', '+250788100002', 'Marie Claire', 'MP240106.1234.A00002', 0.94, 'allocated', NOW() - INTERVAL '1 day 2 hours'),
  
  -- 2 days ago - allocated
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0003-0003-0003-0003-000000000003', 'gggg0002-0002-0002-0002-000000000002', 'DEPOSIT', 150000, 'RWF', 'MOMO', 'COMPLETED', 'TXN006', NOW() - INTERVAL '2 days', '+250788100003', 'Emmanuel Niyonzima', 'MP240105.1234.A00001', 0.91, 'allocated', NOW() - INTERVAL '2 days'),
  
  -- 3 days ago - allocated
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0001-0001-0001-0001-000000000001', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 45000, 'RWF', 'MOMO', 'COMPLETED', 'TXN007', NOW() - INTERVAL '3 days', '+250788100001', 'Jean Damascene', 'MP240104.1234.A00001', 0.89, 'allocated', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'mmmm0002-0002-0002-0002-000000000002', 'gggg0001-0001-0001-0001-000000000001', 'DEPOSIT', 60000, 'RWF', 'MOMO', 'COMPLETED', 'TXN008', NOW() - INTERVAL '3 days 4 hours', '+250788100002', 'Marie Claire', 'MP240104.1234.A00002', 0.93, 'allocated', NOW() - INTERVAL '3 days 4 hours'),
  
  -- Institution 2 - allocated
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'mmmm0004-0004-0004-0004-000000000004', 'gggg0003-0003-0003-0003-000000000003', 'DEPOSIT', 80000, 'RWF', 'MOMO', 'COMPLETED', 'TXN009', NOW() - INTERVAL '5 hours', '+250788100004', 'Patricie Uwimana', 'MP240107.5678.B00001', 0.96, 'allocated', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'mmmm0004-0004-0004-0004-000000000004', 'gggg0003-0003-0003-0003-000000000003', 'DEPOSIT', 120000, 'RWF', 'MOMO', 'COMPLETED', 'TXN010', NOW() - INTERVAL '1 day 3 hours', '+250788100004', 'Patricie Uwimana', 'MP240106.5678.B00001', 0.90, 'allocated', NOW() - INTERVAL '1 day 3 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create unallocated transactions (needs attention)
-- ============================================================================

INSERT INTO public.transactions (id, institution_id, type, amount, currency, channel, status, reference, occurred_at, payer_phone, payer_name, momo_ref, parse_confidence, allocation_status, created_at)
VALUES
  -- Today - unallocated (low confidence)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 35000, 'RWF', 'MOMO', 'COMPLETED', 'TXN011', NOW() - INTERVAL '1 hour', '+250788999001', 'Unknown Sender', 'MP240107.XXXX.U00001', 0.45, 'unallocated', NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 15000, 'RWF', 'MOMO', 'COMPLETED', 'TXN012', NOW() - INTERVAL '30 minutes', '+250788999002', NULL, 'MP240107.XXXX.U00002', 0.52, 'unallocated', NOW() - INTERVAL '30 minutes'),
  
  -- Today - unallocated (medium confidence but no member match)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 70000, 'RWF', 'MOMO', 'COMPLETED', 'TXN013', NOW() - INTERVAL '2 hours 30 minutes', '+250788999003', 'New Customer', 'MP240107.XXXX.U00003', 0.78, 'unallocated', NOW() - INTERVAL '2 hours 30 minutes'),
  
  -- Yesterday - unallocated (aging)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 40000, 'RWF', 'MOMO', 'COMPLETED', 'TXN014', NOW() - INTERVAL '1 day 5 hours', '+250788999004', 'Pending Review', 'MP240106.XXXX.U00001', 0.60, 'unallocated', NOW() - INTERVAL '1 day 5 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 55000, 'RWF', 'MOMO', 'COMPLETED', 'TXN015', NOW() - INTERVAL '1 day 8 hours', '+250788999005', NULL, 'MP240106.XXXX.U00002', 0.55, 'unallocated', NOW() - INTERVAL '1 day 8 hours'),
  
  -- 2+ days ago - aging unallocated
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 90000, 'RWF', 'MOMO', 'COMPLETED', 'TXN016', NOW() - INTERVAL '2 days 3 hours', '+250788999006', 'Old Transaction', 'MP240105.XXXX.U00001', 0.48, 'unallocated', NOW() - INTERVAL '2 days 3 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'DEPOSIT', 22000, 'RWF', 'MOMO', 'COMPLETED', 'TXN017', NOW() - INTERVAL '3 days', '+250788999007', NULL, 'MP240104.XXXX.U00001', 0.42, 'unallocated', NOW() - INTERVAL '3 days'),
  
  -- Institution 2 - unallocated
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'DEPOSIT', 65000, 'RWF', 'MOMO', 'COMPLETED', 'TXN018', NOW() - INTERVAL '4 hours', '+250789999001', 'Unknown', 'MP240107.YYYY.U00001', 0.55, 'unallocated', NOW() - INTERVAL '4 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'DEPOSIT', 28000, 'RWF', 'MOMO', 'COMPLETED', 'TXN019', NOW() - INTERVAL '1 day 6 hours', '+250789999002', NULL, 'MP240106.YYYY.U00001', 0.50, 'unallocated', NOW() - INTERVAL '1 day 6 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create MoMo SMS raw with parse errors
-- ============================================================================

INSERT INTO public.momo_sms_raw (id, institution_id, sender_phone, sms_text, received_at, source, hash, parse_status, parse_error, created_at)
VALUES
  -- Parse errors for Institution 1
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MobileMoney', 'Your transaction of RWF ****** has been completed. Ref: ****', NOW() - INTERVAL '45 minutes', 'android_gateway', md5(random()::text), 'error', 'Amount not parseable: masked with asterisks', NOW() - INTERVAL '45 minutes'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MTN Mobile', 'Umaze kw... message truncated', NOW() - INTERVAL '2 hours', 'android_gateway', md5(random()::text), 'error', 'Message truncated, cannot extract transaction details', NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MoMo', 'Balance enquiry: Your current balance is 150,000 RWF', NOW() - INTERVAL '3 hours', 'android_gateway', md5(random()::text), 'error', 'Not a transaction message: balance enquiry', NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'SPAM', 'Congratulations! You have won 1,000,000 RWF. Call now!', NOW() - INTERVAL '5 hours', 'android_gateway', md5(random()::text), 'error', 'Spam message detected', NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MobileMoney', 'Transaction failed. Please try again.', NOW() - INTERVAL '1 day', 'android_gateway', md5(random()::text), 'error', 'Failed transaction notification, no amount', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MTN', 'Y''ello! Your airtime of 500 RWF has been loaded.', NOW() - INTERVAL '1 day 3 hours', 'android_gateway', md5(random()::text), 'error', 'Airtime top-up, not a payment transaction', NOW() - INTERVAL '1 day 3 hours'),
  
  -- Parse errors for Institution 2
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'MoMo', 'Payment confirmation... [garbled text]', NOW() - INTERVAL '6 hours', 'android_gateway', md5(random()::text), 'error', 'Message encoding error, cannot parse', NOW() - INTERVAL '6 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'MobileMoney', 'You sent 50000 RWF to JOHN DOE. Ref: null', NOW() - INTERVAL '8 hours', 'android_gateway', md5(random()::text), 'error', 'Outgoing transaction, not incoming payment', NOW() - INTERVAL '8 hours'),
  
  -- Successfully parsed (for comparison)
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MobileMoney', 'You have received 50,000 RWF from Jean Damascene (+250788100001). Ref: MP240107.1234.A00001', NOW() - INTERVAL '2 hours', 'android_gateway', md5(random()::text || '1'), 'parsed', NULL, NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'MoMo', 'Payment received: 25,000 RWF from Marie Claire. Transaction ID: MP240107.1234.A00002', NOW() - INTERVAL '3 hours', 'android_gateway', md5(random()::text || '2'), 'parsed', NULL, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create audit log entries for recent activity
-- ============================================================================

INSERT INTO public.audit_log (id, institution_id, actor_user_id, actor_email, action, entity_type, entity_id, metadata, created_at)
VALUES
  -- Transaction allocations
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0003-0003-0003-0003-000000000003', 'staff1@kigalisacco.rw', 'allocate_transaction', 'transaction', gen_random_uuid()::text, '{"amount": 50000, "member_name": "Jean Damascene"}'::jsonb, NOW() - INTERVAL '2 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0003-0003-0003-0003-000000000003', 'staff1@kigalisacco.rw', 'allocate_transaction', 'transaction', gen_random_uuid()::text, '{"amount": 25000, "member_name": "Marie Claire"}'::jsonb, NOW() - INTERVAL '3 hours'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'allocate_transaction', 'transaction', gen_random_uuid()::text, '{"amount": 100000, "member_name": "Emmanuel Niyonzima"}'::jsonb, NOW() - INTERVAL '4 hours'),
  
  -- Member operations
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'create_member', 'member', 'mmmm0001-0001-0001-0001-000000000001', '{"name": "Jean Damascene", "group": "Umuganda Savings Group"}'::jsonb, NOW() - INTERVAL '5 hours'),
  
  -- Group operations
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'update_group', 'group', 'gggg0001-0001-0001-0001-000000000001', '{"field": "status", "old": "PENDING", "new": "ACTIVE"}'::jsonb, NOW() - INTERVAL '6 hours'),
  
  -- Settings changes
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'update_parsing_settings', 'settings', '11111111-1111-1111-1111-111111111111', '{"confidence_threshold": {"old": 0.80, "new": 0.85}}'::jsonb, NOW() - INTERVAL '8 hours'),
  
  -- Logins
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0003-0003-0003-0003-000000000003', 'staff1@kigalisacco.rw', 'login', 'profile', 'eeee0003-0003-0003-0003-000000000003', NULL, NOW() - INTERVAL '1 hour'),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0002-0002-0002-0002-000000000002', 'manager@kigalisacco.rw', 'login', 'profile', 'eeee0002-0002-0002-0002-000000000002', NULL, NOW() - INTERVAL '2 hours'),
  
  -- SMS source activity
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'eeee0001-0001-0001-0001-000000000001', 'admin@ibimina.rw', 'register_sms_source', 'sms_source', 'dddd1111-1111-1111-1111-111111111111', '{"name": "Office Phone", "type": "android_gateway"}'::jsonb, NOW() - INTERVAL '1 day'),
  
  -- Institution 2 activity
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'eeee0005-0005-0005-0005-000000000005', 'manager@rwandamf.rw', 'allocate_transaction', 'transaction', gen_random_uuid()::text, '{"amount": 80000, "member_name": "Patricie Uwimana"}'::jsonb, NOW() - INTERVAL '5 hours'),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 'eeee0005-0005-0005-0005-000000000005', 'manager@rwandamf.rw', 'login', 'profile', 'eeee0005-0005-0005-0005-000000000005', NULL, NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create SMS sources (including offline case for dashboard testing)
-- ============================================================================

INSERT INTO public.sms_sources (id, institution_id, name, source_type, is_active, last_seen_at, webhook_secret, created_at)
VALUES
  -- Active SMS source (recently seen)
  ('ssss0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Office Phone - Active', 'android_gateway', true, NOW() - INTERVAL '30 minutes', md5(random()::text), NOW() - INTERVAL '30 days'),
  -- Offline SMS source (last seen > 6 hours ago - should trigger attention)
  ('ssss0002-0002-0002-0002-000000000002', '11111111-1111-1111-1111-111111111111', 'Field Agent Phone - OFFLINE', 'android_gateway', true, NOW() - INTERVAL '12 hours', md5(random()::text), NOW() - INTERVAL '25 days'),
  -- Institution 2 - active source
  ('ssss0003-0003-0003-0003-000000000003', '22222222-2222-2222-2222-222222222222', 'Main Office Gateway', 'webhook', true, NOW() - INTERVAL '15 minutes', md5(random()::text), NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Summary
-- ============================================================================
-- This seed creates:
-- - 3 groups (2 for institution 1, 1 for institution 2)
-- - 4 members across groups
-- - 10 allocated transactions (various days)
-- - 9 unallocated transactions (needs attention, some aging)
-- - 10 MoMo SMS raw records (8 with parse errors, 2 successfully parsed)
-- - 12 audit log entries (allocations, logins, settings changes)
-- - 3 SMS sources (1 offline for attention testing)
-- ============================================================================


