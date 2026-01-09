-- Test Data Generation Script
-- This script generates test data for performance testing

-- WARNING: This script generates large amounts of test data
-- Only run in development/staging environments

-- Generate test institutions (if needed)
INSERT INTO institutions (id, name, type, status, code, created_at)
SELECT 
  gen_random_uuid(),
  'Test Institution ' || generate_series,
  CASE (generate_series % 3)
    WHEN 0 THEN 'BANK'
    WHEN 1 THEN 'MFI'
    ELSE 'SACCO'
  END,
  'ACTIVE',
  'INST' || LPAD(generate_series::text, 4, '0'),
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;

-- Generate test groups (1000+ groups)
INSERT INTO groups (id, institution_id, group_name, status, expected_amount, frequency, currency, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  'Test Group ' || generate_series,
  'ACTIVE',
  10000 + (random() * 100000)::numeric,
  CASE (generate_series % 2)
    WHEN 0 THEN 'Weekly'
    ELSE 'Monthly'
  END,
  'RWF',
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 1000)
ON CONFLICT DO NOTHING;

-- Generate test members (1000+ members)
INSERT INTO members (id, institution_id, full_name, phone, status, savings_balance, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  'Test Member ' || generate_series,
  '078' || LPAD((1000000 + generate_series)::text, 7, '0'),
  'ACTIVE',
  (random() * 1000000)::numeric,
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 1000)
ON CONFLICT DO NOTHING;

-- Generate test transactions (10000+ transactions)
INSERT INTO transactions (
  id, institution_id, occurred_at, amount, currency, type, channel, 
  status, allocation_status, payer_phone, momo_ref, created_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  NOW() - (random() * interval '90 days'),
  1000 + (random() * 100000)::numeric,
  'RWF',
  'CONTRIBUTION',
  'MOMO',
  'COMPLETED',
  CASE (generate_series % 4)
    WHEN 0 THEN 'allocated'
    WHEN 1 THEN 'unallocated'
    WHEN 2 THEN 'flagged'
    ELSE 'allocated'
  END,
  '078' || LPAD((1000000 + (random() * 1000)::int)::text, 7, '0'),
  'REF' || LPAD(generate_series::text, 10, '0'),
  NOW() - (random() * interval '90 days')
FROM generate_series(1, 10000)
ON CONFLICT DO NOTHING;

-- Generate test staff (100+ staff)
INSERT INTO profiles (user_id, institution_id, email, full_name, role, status, is_active, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  'staff' || generate_series || '@test.com',
  'Test Staff ' || generate_series,
  CASE (generate_series % 5)
    WHEN 0 THEN 'INSTITUTION_ADMIN'
    WHEN 1 THEN 'BRANCH_MANAGER'
    WHEN 2 THEN 'LOAN_OFFICER'
    WHEN 3 THEN 'TELLER'
    ELSE 'AUDITOR'
  END,
  'ACTIVE',
  true,
  NOW() - (random() * interval '365 days')
FROM generate_series(1, 100)
ON CONFLICT DO NOTHING;

-- Generate test SMS gateway devices (50+ devices)
INSERT INTO sms_gateway_devices (id, institution_id, device_name, momo_code, status, device_key_hash, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  'Test Device ' || generate_series,
  'MOMO' || LPAD(generate_series::text, 6, '0'),
  CASE (generate_series % 3)
    WHEN 0 THEN 'active'
    WHEN 1 THEN 'suspended'
    ELSE 'active'
  END,
  encode(gen_random_bytes(32), 'hex'),
  NOW() - (random() * interval '180 days')
FROM generate_series(1, 50)
ON CONFLICT DO NOTHING;

-- Generate test group memberships
INSERT INTO group_members (id, institution_id, group_id, member_id, role, status, created_at)
SELECT 
  gen_random_uuid(),
  g.institution_id,
  g.id,
  m.id,
  CASE (random() * 100)
    WHEN 0 THEN 'LEADER'
    WHEN 1 THEN 'CHAIRPERSON'
    WHEN 2 THEN 'SECRETARY'
    WHEN 3 THEN 'TREASURER'
    ELSE 'MEMBER'
  END,
  'GOOD_STANDING',
  NOW() - (random() * interval '365 days')
FROM groups g
CROSS JOIN LATERAL (
  SELECT id, institution_id FROM members 
  WHERE institution_id = g.institution_id 
  ORDER BY random() 
  LIMIT (5 + (random() * 20)::int)
) m
WHERE NOT EXISTS (
  SELECT 1 FROM group_members gm 
  WHERE gm.group_id = g.id AND gm.member_id = m.id
)
LIMIT 5000;

-- Generate test audit log entries (1000+ entries)
INSERT INTO audit_log (id, actor_user_id, institution_id, action, entity_type, entity_id, metadata, created_at)
SELECT 
  gen_random_uuid(),
  (SELECT user_id FROM profiles ORDER BY random() LIMIT 1),
  (SELECT id FROM institutions ORDER BY random() LIMIT 1),
  CASE (generate_series % 10)
    WHEN 0 THEN 'create_member'
    WHEN 1 THEN 'update_member'
    WHEN 2 THEN 'allocate_transaction'
    WHEN 3 THEN 'create_group'
    WHEN 4 THEN 'update_group'
    WHEN 5 THEN 'set_primary_momo_code'
    WHEN 6 THEN 'register_sms_source'
    WHEN 7 THEN 'create_staff_invite'
    WHEN 8 THEN 'update_staff_role'
    ELSE 'deactivate_staff'
  END,
  CASE (generate_series % 5)
    WHEN 0 THEN 'member'
    WHEN 1 THEN 'group'
    WHEN 2 THEN 'transaction'
    WHEN 3 THEN 'institution'
    ELSE 'profile'
  END,
  gen_random_uuid(),
  jsonb_build_object('test', true, 'series', generate_series),
  NOW() - (random() * interval '90 days')
FROM generate_series(1, 1000)
ON CONFLICT DO NOTHING;

-- Verify data was created
SELECT 
  'Institutions' as table_name, COUNT(*) as count FROM institutions
UNION ALL
SELECT 'Groups', COUNT(*) FROM groups
UNION ALL
SELECT 'Members', COUNT(*) FROM members
UNION ALL
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'SMS Gateway Devices', COUNT(*) FROM sms_gateway_devices
UNION ALL
SELECT 'Group Members', COUNT(*) FROM group_members
UNION ALL
SELECT 'Audit Log', COUNT(*) FROM audit_log;
